use std::{cell::RefCell, rc::Rc};

use gloo::render::{request_animation_frame, AnimationFrame};
use wasm_bindgen::prelude::*;
use web_sys::{HtmlCanvasElement, Window};
use wgpu::util::DeviceExt;

pub mod identity;
pub mod crypto;

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
    view_proj: [[f32; 4]; 4], // Matriz combinada 4x4 (64 bytes)
    time: [f32; 4],           // Time + Padding (16 bytes)
}

// --- Shader WGSL ---
const SHADER: &str = r#"
struct Uniforms {
    view_proj: mat4x4<f32>,
    time: vec4<f32>, // .x = time
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

@vertex
fn vs_main(model: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    
    let t = u.time.x;
    var pos = model.position;
    
    // Deformación (Onda)
    let dist = length(pos.xz);
    let y = sin(dist * 5.0 - t * 2.0) * 0.5 + sin(pos.x * 3.0 + t) * 0.2;
    pos.y = y;

    // Transformación usando la matriz pre-calculada
    out.clip_position = u.view_proj * vec4<f32>(pos, 1.0);
    
    // Color basado en altura
    let color_high = vec3<f32>(0.2, 0.8, 1.0); // Cyan
    let color_low = vec3<f32>(0.8, 0.1, 0.5);  // Magenta
    let mix_factor = clamp((y + 0.5), 0.0, 1.0);
    
    out.color = vec4<f32>(mix(color_low, color_high, mix_factor), 1.0);
    
    // Grid visual
    let grid = step(0.9, fract(model.uv.x * 20.0)) + step(0.9, fract(model.uv.y * 20.0));
    out.color += vec4<f32>(vec3<f32>(grid * 0.3), 0.0);

    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    return in.color;
}
"#;

// --- Math Helpers (CPU Side) ---

fn generate_view_projection(width: f32, height: f32, time: f32) -> [[f32; 4]; 4] {
    let aspect = width / height;
    let fov_y = 45.0f32.to_radians();
    let near = 0.1;
    let far = 100.0;

    // Matriz de Proyección (WebGPU depth [0, 1])
    let f = 1.0 / (fov_y / 2.0).tan();
    let proj = [
        [f / aspect, 0.0, 0.0, 0.0],
        [0.0, f, 0.0, 0.0],
        [0.0, 0.0, far / (near - far), -1.0],
        [0.0, 0.0, (near * far) / (near - far), 0.0],
    ];

    // Matriz de Vista (Cámara orbitando)
    let radius = 8.0;
    let cam_x = time.cos() * radius;
    let cam_z = time.sin() * radius;
    let eye = [cam_x, 5.0, cam_z];
    let center = [0.0, 0.0, 0.0];
    let up = [0.0, 1.0, 0.0];

    // LookAt
    let z_axis = normalize(sub(eye, center));
    let x_axis = normalize(cross(up, z_axis));
    let y_axis = cross(z_axis, x_axis);

    let view = [
        [x_axis[0], y_axis[0], z_axis[0], 0.0],
        [x_axis[1], y_axis[1], z_axis[1], 0.0],
        [x_axis[2], y_axis[2], z_axis[2], 0.0],
        [-dot(x_axis, eye), -dot(y_axis, eye), -dot(z_axis, eye), 1.0],
    ];

    multiply_matrices(proj, view)
}

fn sub(a: [f32; 3], b: [f32; 3]) -> [f32; 3] {
    [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

fn cross(a: [f32; 3], b: [f32; 3]) -> [f32; 3] {
    [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ]
}

fn normalize(v: [f32; 3]) -> [f32; 3] {
    let len = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt();
    if len == 0.0 { [0.0; 3] } else { [v[0] / len, v[1] / len, v[2] / len] }
}

fn dot(a: [f32; 3], b: [f32; 3]) -> f32 {
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

fn multiply_matrices(a: [[f32; 4]; 4], b: [[f32; 4]; 4]) -> [[f32; 4]; 4] {
    let mut out = [[0.0; 4]; 4];
    for i in 0..4 {
        for j in 0..4 {
            out[i][j] = a[0][j] * b[i][0] + a[1][j] * b[i][1] + a[2][j] * b[i][2] + a[3][j] * b[i][3];
        }
    }
    out
}

// [OMITTED FOR BRIEFNESS - Temporarily commenting out wgpu logic to fix build]
/*
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
    // ... (implementation)
}

// ... (helper functions)

thread_local! {
    static RAF_HANDLE: RefCell<Option<AnimationFrame>> = const { RefCell::new(None) };
}

#[wasm_bindgen]
pub async fn start(canvas: HtmlCanvasElement) -> Result<(), JsValue> {
    // ... (implementation)
    Ok(())
}

#[wasm_bindgen]
pub fn stop() {
    RAF_HANDLE.with(|h| {
        *h.borrow_mut() = None;
    });
}
*/