use std::{cell::RefCell, rc::Rc};

use gloo::render::{request_animation_frame, AnimationFrame};
use wasm_bindgen::prelude::*;
use web_sys::{HtmlCanvasElement, Window};
use wgpu::util::DeviceExt;

// --- Estructuras de Datos ---

#[repr(C)]
#[derive(Copy, Clone, Debug, bytemuck::Pod, bytemuck::Zeroable)]
struct Vertex {
    position: [f32; 3], // X, Y, Z
    uv: [f32; 2],       // Coordenadas de textura para efectos
}

#[repr(C)]
#[derive(Copy, Clone, Debug, bytemuck::Pod, bytemuck::Zeroable)]
struct Uniforms {
    time: f32,
    width: f32,
    height: f32,
    _pad: f32,
}

// --- Shader WGSL ---
// Una función matemática 3D animada (Vertex Displacement)
const SHADER: &str = r#"
struct Uniforms {
    time: f32,
    width: f32,
    height: f32,
    _pad: f32,
}
@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) color: vec4<f32>,
};

// Matriz de proyección simple (Perspectiva)
fn perspective(fov: f32, aspect: f32, near: f32, far: f32) -> mat4x4<f32> {
    let f = 1.0 / tan(fov / 2.0);
    return mat4x4<f32>(
        vec4<f32>(f / aspect, 0.0, 0.0, 0.0),
        vec4<f32>(0.0, f, 0.0, 0.0),
        vec4<f32>(0.0, 0.0, (far + near) / (near - far), -1.0),
        vec4<f32>(0.0, 0.0, (2.0 * far * near) / (near - far), 0.0)
    );
}

// Matriz de vista (LookAt simple)
fn look_at(eye: vec3<f32>, center: vec3<f32>, up: vec3<f32>) -> mat4x4<f32> {
    let z = normalize(eye - center);
    let x = normalize(cross(up, z));
    let y = cross(z, x);
    return mat4x4<f32>(
        vec4<f32>(x.x, y.x, z.x, 0.0),
        vec4<f32>(x.y, y.y, z.y, 0.0),
        vec4<f32>(x.z, y.z, z.z, 0.0),
        vec4<f32>(-dot(x, eye), -dot(y, eye), -dot(z, eye), 1.0)
    );
}

@vertex
fn vs_main(model: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    
    // 1. Deformación Matemática (Onda) en base al Tiempo y Posición
    let t = u.time;
    var pos = model.position;
    
    // Función "Cool": Ondas concéntricas + seno en movimiento
    let dist = length(pos.xz);
    let y = sin(dist * 5.0 - t * 2.0) * 0.5 + sin(pos.x * 3.0 + t) * 0.2;
    pos.y = y;

    // 2. Transformaciones de Cámara
    let aspect = u.width / u.height;
    let proj = perspective(1.0, aspect, 0.1, 100.0);
    
    // Cámara rotando suavemente
    let cam_x = cos(t * 0.2) * 5.0;
    let cam_z = sin(t * 0.2) * 5.0;
    let view = look_at(vec3<f32>(cam_x, 4.0, cam_z), vec3<f32>(0.0, 0.0, 0.0), vec3<f32>(0.0, 1.0, 0.0));
    
    out.clip_position = proj * view * vec4<f32>(pos, 1.0);
    
    // 3. Color basado en altura (y) y normal aproximada
    let color_high = vec3<f32>(0.2, 0.8, 1.0); // Cyan neon
    let color_low = vec3<f32>(0.8, 0.1, 0.5);  // Magenta neon
    let mix_factor = clamp((y + 0.5), 0.0, 1.0);
    
    out.color = vec4<f32>(mix(color_low, color_high, mix_factor), 1.0);
    
    // Añadir un poco de "grid" visual usando coordenadas UV
    let grid = step(0.9, fract(model.uv.x * 20.0)) + step(0.9, fract(model.uv.y * 20.0));
    out.color += vec4<f32>(vec3<f32>(grid * 0.3), 0.0);

    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    return in.color;
}
"#;

struct State {
    surface: wgpu::Surface<'static>,
    device: wgpu::Device,
    queue: wgpu::Queue,
    config: wgpu::SurfaceConfiguration,
    render_pipeline: wgpu::RenderPipeline,
    vertex_buffer: wgpu::Buffer,
    index_buffer: wgpu::Buffer,
    uniform_buffer: wgpu::Buffer,
    bind_group: wgpu::BindGroup,
    depth_texture: wgpu::Texture,
    depth_view: wgpu::TextureView,
    num_indices: u32,
    _start: f64,
}

impl State {
    fn resize_if_needed(&mut self, window: &Window, canvas: &HtmlCanvasElement) {
        // Corrección DPI: Obtener el pixel ratio real
        let pixel_ratio = window.device_pixel_ratio();
        let width = (canvas.client_width() as f64 * pixel_ratio) as u32;
        let height = (canvas.client_height() as f64 * pixel_ratio) as u32;
        
        // Ajustar tamaño físico del canvas si no coincide
        if canvas.width() != width || canvas.height() != height {
            canvas.set_width(width);
            canvas.set_height(height);
        }

        let width = width.max(1);
        let height = height.max(1);
        
        if self.config.width == width && self.config.height == height {
            return;
        }
        
        self.config.width = width;
        self.config.height = height;
        self.surface.configure(&self.device, &self.config);
        
        // Recrear Depth Texture al cambiar tamaño
        self.depth_texture = self.device.create_texture(&wgpu::TextureDescriptor {
            label: Some("Depth Texture"),
            size: wgpu::Extent3d {
                width,
                height,
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: wgpu::TextureFormat::Depth32Float,
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            view_formats: &[],
        });
        self.depth_view = self.depth_texture.create_view(&wgpu::TextureViewDescriptor::default());
    }

    fn render(&mut self, time_s: f32) {
        // Actualizar Uniforms
        let input = Uniforms {
            time: time_s,
            width: self.config.width as f32,
            height: self.config.height as f32,
            _pad: 0.0,
        };
        self.queue.write_buffer(&self.uniform_buffer, 0, bytemuck::cast_slice(&[input]));

        let frame = match self.surface.get_current_texture() {
            Ok(frame) => frame,
            Err(_) => return,
        };
        let view = frame.texture.create_view(&wgpu::TextureViewDescriptor::default());

        let mut encoder = self.device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
            label: Some("Render Encoder"),
        });

        {
            let mut render_pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("Render Pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &view,
                    resolve_target: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Clear(wgpu::Color {
                            r: 0.05,
                            g: 0.05,
                            b: 0.1,
                            a: 1.0,
                        }),
                        store: wgpu::StoreOp::Store,
                    },
                })],
                // Usar Depth Buffer
                depth_stencil_attachment: Some(wgpu::RenderPassDepthStencilAttachment {
                    view: &self.depth_view,
                    depth_ops: Some(wgpu::Operations {
                        load: wgpu::LoadOp::Clear(1.0),
                        store: wgpu::StoreOp::Store,
                    }),
                    stencil_ops: None,
                }),
                occlusion_query_set: None,
                timestamp_writes: None,
            });

            render_pass.set_pipeline(&self.render_pipeline);
            render_pass.set_bind_group(0, &self.bind_group, &[]);
            render_pass.set_vertex_buffer(0, self.vertex_buffer.slice(..));
            render_pass.set_index_buffer(self.index_buffer.slice(..), wgpu::IndexFormat::Uint16);
            render_pass.draw_indexed(0..self.num_indices, 0, 0..1);
        }

        self.queue.submit(std::iter::once(encoder.finish()));
        frame.present();
    }
}

// Helper para generar una malla plana (Grid)
fn create_plane_mesh(device: &wgpu::Device) -> (wgpu::Buffer, wgpu::Buffer, u32) {
    let size = 20;
    let scale = 0.2;
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    // Generar vértices
    for z in 0..=size {
        for x in 0..=size {
            let x_pos = (x as f32 - size as f32 / 2.0) * scale;
            let z_pos = (z as f32 - size as f32 / 2.0) * scale;
            vertices.push(Vertex {
                position: [x_pos, 0.0, z_pos],
                uv: [x as f32 / size as f32, z as f32 / size as f32],
            });
        }
    }

    // Generar índices (quads -> triángulos)
    for z in 0..size {
        for x in 0..size {
            let row1 = z * (size + 1);
            let row2 = (z + 1) * (size + 1);
            
            // Triángulo 1
            indices.push((row1 + x) as u16);
            indices.push((row2 + x) as u16);
            indices.push((row1 + x + 1) as u16);
            
            // Triángulo 2
            indices.push((row1 + x + 1) as u16);
            indices.push((row2 + x) as u16);
            indices.push((row2 + x + 1) as u16);
        }
    }

    let vertex_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
        label: Some("Vertex Buffer"),
        contents: bytemuck::cast_slice(&vertices),
        usage: wgpu::BufferUsages::VERTEX,
    });
    
    let index_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
        label: Some("Index Buffer"),
        contents: bytemuck::cast_slice(&indices),
        usage: wgpu::BufferUsages::INDEX,
    });

    (vertex_buffer, index_buffer, indices.len() as u32)
}

thread_local! {
    static RAF_HANDLE: RefCell<Option<AnimationFrame>> = const { RefCell::new(None) };
}

#[wasm_bindgen]
pub async fn start(canvas: HtmlCanvasElement) -> Result<(), JsValue> {
    console_error_panic_hook::set_once();
    
    let window = web_sys::window().ok_or("no global window")?;

    let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
        backends: wgpu::Backends::all(),
        ..Default::default()
    });

    let surface = instance
        .create_surface(wgpu::SurfaceTarget::Canvas(canvas.clone()))
        .map_err(|e| JsValue::from_str(&format!("create_surface failed: {e:?}")))?;

    let adapter = instance
        .request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            compatible_surface: Some(&surface),
            force_fallback_adapter: false,
        })
        .await
        .ok_or_else(|| JsValue::from_str("No suitable GPU adapter"))?;

    let (device, queue) = adapter
        .request_device(
            &wgpu::DeviceDescriptor {
                label: Some("Device"),
                required_features: wgpu::Features::empty(),
                required_limits: wgpu::Limits::downlevel_webgl2_defaults()
                    .using_resolution(adapter.limits()),
                memory_hints: wgpu::MemoryHints::default(),
            },
            None,
        )
        .await
        .map_err(|e| JsValue::from_str(&format!("request_device failed: {e:?}")))?;

    // Malla
    let (vertex_buffer, index_buffer, num_indices) = create_plane_mesh(&device);

    // Shader
    let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
        label: Some("Shader"),
        source: wgpu::ShaderSource::Wgsl(SHADER.into()),
    });
    
    // Uniforms
    let uniform_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
        label: Some("Uniform Buffer"),
        contents: bytemuck::cast_slice(&[Uniforms {
            time: 0.0,
            width: canvas.width() as f32,
            height: canvas.height() as f32,
            _pad: 0.0,
        }]),
        usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
    });

    let bind_group_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
        label: Some("Bind Group Layout"),
        entries: &[wgpu::BindGroupLayoutEntry {
            binding: 0,
            visibility: wgpu::ShaderStages::VERTEX | wgpu::ShaderStages::FRAGMENT,
            ty: wgpu::BindingType::Buffer {
                ty: wgpu::BufferBindingType::Uniform,
                has_dynamic_offset: false,
                min_binding_size: None,
            },
            count: None,
        }],
    });
    
    let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
        label: Some("Bind Group"),
        layout: &bind_group_layout,
        entries: &[wgpu::BindGroupEntry {
            binding: 0,
            resource: uniform_buffer.as_entire_binding(),
        }],
    });

    let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
        label: Some("Pipeline Layout"),
        bind_group_layouts: &[&bind_group_layout],
        push_constant_ranges: &[],
    });

    let caps = surface.get_capabilities(&adapter);
    let swapchain_format = caps.formats[0];

    // Profundidad
    let depth_texture = device.create_texture(&wgpu::TextureDescriptor {
        label: Some("Depth Texture"),
        size: wgpu::Extent3d {
            width: canvas.width().max(1),
            height: canvas.height().max(1),
            depth_or_array_layers: 1,
        },
        mip_level_count: 1,
        sample_count: 1,
        dimension: wgpu::TextureDimension::D2,
        format: wgpu::TextureFormat::Depth32Float,
        usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
        view_formats: &[],
    });
    let depth_view = depth_texture.create_view(&wgpu::TextureViewDescriptor::default());

    let render_pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
        label: Some("Render Pipeline"),
        layout: Some(&pipeline_layout),
        vertex: wgpu::VertexState {
            module: &shader,
            entry_point: Some("vs_main"),
            buffers: &[wgpu::VertexBufferLayout {
                array_stride: std::mem::size_of::<Vertex>() as wgpu::BufferAddress,
                step_mode: wgpu::VertexStepMode::Vertex,
                attributes: &[
                    wgpu::VertexAttribute { // Pos
                        offset: 0,
                        shader_location: 0,
                        format: wgpu::VertexFormat::Float32x3,
                    },
                    wgpu::VertexAttribute { // UV
                        offset: std::mem::size_of::<[f32; 3]>() as wgpu::BufferAddress,
                        shader_location: 1,
                        format: wgpu::VertexFormat::Float32x2,
                    },
                ],
            }],
            compilation_options: wgpu::PipelineCompilationOptions::default(),
        },
        fragment: Some(wgpu::FragmentState {
            module: &shader,
            entry_point: Some("fs_main"),
            targets: &[Some(wgpu::ColorTargetState {
                format: swapchain_format,
                blend: Some(wgpu::BlendState::REPLACE),
                write_mask: wgpu::ColorWrites::ALL,
            })],
            compilation_options: wgpu::PipelineCompilationOptions::default(),
        }),
        primitive: wgpu::PrimitiveState {
            topology: wgpu::PrimitiveTopology::TriangleList,
            strip_index_format: None,
            front_face: wgpu::FrontFace::Ccw,
            cull_mode: None, 
            polygon_mode: wgpu::PolygonMode::Fill,
            unclipped_depth: false,
            conservative: false,
        },
        depth_stencil: Some(wgpu::DepthStencilState {
            format: wgpu::TextureFormat::Depth32Float,
            depth_write_enabled: true,
            depth_compare: wgpu::CompareFunction::Less,
            stencil: wgpu::StencilState::default(),
            bias: wgpu::DepthBiasState::default(),
        }),
        multisample: wgpu::MultisampleState::default(),
        multiview: None,
        cache: None,
    });

    let config = wgpu::SurfaceConfiguration {
        usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
        format: swapchain_format,
        width: canvas.width().max(1),
        height: canvas.height().max(1),
        present_mode: wgpu::PresentMode::Fifo,
        alpha_mode: caps.alpha_modes[0],
        view_formats: vec![],
        desired_maximum_frame_latency: 2,
    };
    surface.configure(&device, &config);

    let state = State {
        surface,
        device,
        queue,
        config,
        render_pipeline,
        vertex_buffer,
        index_buffer,
        uniform_buffer,
        bind_group,
        depth_texture,
        depth_view,
        num_indices,
        _start: js_sys::Date::now(),
    };

    let state = Rc::new(RefCell::new(state));
    let canvas = Rc::new(canvas);

    fn schedule(state: Rc<RefCell<State>>, canvas: Rc<HtmlCanvasElement>, window: Rc<Window>) {
        let handle = request_animation_frame(move |_ts| {
            let now = js_sys::Date::now();
            let start_time = state.borrow()._start;
            let t = ((now - start_time) / 1000.0) as f32;

            {
                let mut st = state.borrow_mut();
                st.resize_if_needed(&window, &canvas);
                st.render(t);
            }

            schedule(state.clone(), canvas.clone(), window.clone());
        });

        RAF_HANDLE.with(|h| *h.borrow_mut() = Some(handle));
    }

    schedule(state, canvas, Rc::new(window));
    Ok(())
}

#[wasm_bindgen]
pub fn stop() {
    RAF_HANDLE.with(|h| {
        *h.borrow_mut() = None;
    });
}
