//! Math utilities for 3D rendering

/// Subtract two 3D vectors
pub fn sub(a: [f32; 3], b: [f32; 3]) -> [f32; 3] {
    [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

/// Cross product of two 3D vectors
pub fn cross(a: [f32; 3], b: [f32; 3]) -> [f32; 3] {
    [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ]
}

/// Normalize a 3D vector
pub fn normalize(v: [f32; 3]) -> [f32; 3] {
    let len = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt();
    if len == 0.0 { 
        [0.0; 3] 
    } else { 
        [v[0] / len, v[1] / len, v[2] / len] 
    }
}

/// Dot product of two 3D vectors
pub fn dot(a: [f32; 3], b: [f32; 3]) -> f32 {
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/// Multiply two 4x4 matrices
pub fn multiply_matrices(a: [[f32; 4]; 4], b: [[f32; 4]; 4]) -> [[f32; 4]; 4] {
    let mut out = [[0.0; 4]; 4];
    for i in 0..4 {
        for j in 0..4 {
            out[i][j] = a[0][j] * b[i][0] + a[1][j] * b[i][1] + a[2][j] * b[i][2] + a[3][j] * b[i][3];
        }
    }
    out
}

/// Generate a combined view-projection matrix for orbiting camera
pub fn generate_view_projection(width: f32, height: f32, time: f32) -> [[f32; 4]; 4] {
    let aspect = width / height;
    let fov_y = 45.0f32.to_radians();
    let near = 0.1;
    let far = 100.0;

    // Projection matrix (WebGPU depth [0, 1])
    let f = 1.0 / (fov_y / 2.0).tan();
    let proj = [
        [f / aspect, 0.0, 0.0, 0.0],
        [0.0, f, 0.0, 0.0],
        [0.0, 0.0, far / (near - far), -1.0],
        [0.0, 0.0, (near * far) / (near - far), 0.0],
    ];

    // View matrix (orbiting camera)
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
