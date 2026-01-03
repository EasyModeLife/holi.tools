//! Mesh generation utilities

use wgpu::util::DeviceExt;

#[repr(C)]
#[derive(Copy, Clone, Debug, bytemuck::Pod, bytemuck::Zeroable)]
pub struct Vertex {
    pub position: [f32; 3],
    pub uv: [f32; 2],
}

impl Vertex {
    pub fn desc() -> wgpu::VertexBufferLayout<'static> {
        wgpu::VertexBufferLayout {
            array_stride: std::mem::size_of::<Vertex>() as wgpu::BufferAddress,
            step_mode: wgpu::VertexStepMode::Vertex,
            attributes: &[
                wgpu::VertexAttribute {
                    offset: 0,
                    shader_location: 0,
                    format: wgpu::VertexFormat::Float32x3,
                },
                wgpu::VertexAttribute {
                    offset: std::mem::size_of::<[f32; 3]>() as wgpu::BufferAddress,
                    shader_location: 1,
                    format: wgpu::VertexFormat::Float32x2,
                },
            ],
        }
    }
}

/// Create a plane mesh with the given grid size
pub fn create_plane_mesh(device: &wgpu::Device, grid_size: u32, scale: f32) -> (wgpu::Buffer, wgpu::Buffer, u32) {
    let size = grid_size;
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

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

    for z in 0..size {
        for x in 0..size {
            let row1 = z * (size + 1);
            let row2 = (z + 1) * (size + 1);
            indices.push((row1 + x) as u16);
            indices.push((row2 + x) as u16);
            indices.push((row1 + x + 1) as u16);
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
