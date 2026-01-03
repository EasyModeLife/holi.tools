//! WASM bindings for holi-qr
//!
//! This is a thin wrapper that exposes holi-qr functionality to JavaScript.
//! All the actual QR logic lives in the `holi-qr` crate.

use holi_qr::{self, ErrorCorrectionLevel, RenderOptions};
use wasm_bindgen::prelude::*;

/// Generate a QR code as SVG string
///
/// # Arguments
/// * `text` - The text/URL to encode
///
/// # Returns
/// SVG string on success, or error message
#[wasm_bindgen]
pub fn generate_qr_svg(text: &str) -> Result<String, JsValue> {
    let qr = holi_qr::generate_qr(text, ErrorCorrectionLevel::Medium)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    Ok(holi_qr::render_svg(&qr))
}

/// Generate a QR code with custom error correction level
///
/// # Arguments
/// * `text` - The text/URL to encode
/// * `ecl` - Error correction level: "L", "M", "Q", or "H"
///
/// # Returns
/// SVG string on success, or error message
#[wasm_bindgen]
pub fn generate_qr_svg_with_ecl(text: &str, ecl: &str) -> Result<String, JsValue> {
    let level = match ecl.to_uppercase().as_str() {
        "L" => ErrorCorrectionLevel::Low,
        "M" => ErrorCorrectionLevel::Medium,
        "Q" => ErrorCorrectionLevel::Quartile,
        "H" => ErrorCorrectionLevel::High,
        _ => return Err(JsValue::from_str("Invalid ECL. Use: L, M, Q, or H")),
    };

    let qr = holi_qr::generate_qr(text, level)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    Ok(holi_qr::render_svg(&qr))
}

/// Generate a QR code with custom colors
///
/// # Arguments
/// * `text` - The text/URL to encode
/// * `dark_color` - Hex color for dark modules (e.g., "#000000")
/// * `light_color` - Hex color for light modules (e.g., "#ffffff")
///
/// # Returns
/// SVG string on success, or error message
#[wasm_bindgen]
pub fn generate_qr_svg_styled(
    text: &str,
    dark_color: &str,
    light_color: &str,
) -> Result<String, JsValue> {
    let qr = holi_qr::generate_qr(text, ErrorCorrectionLevel::Medium)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    let options = RenderOptions {
        dark_color: dark_color.to_string(),
        light_color: light_color.to_string(),
        ..Default::default()
    };
    
    Ok(holi_qr::render_svg_with_options(&qr, &options))
}

#[wasm_bindgen]
pub struct QrMatrix {
    pub size: usize,
    data: Vec<u8>,
}

#[wasm_bindgen]
impl QrMatrix {
    pub fn get_data(&self) -> Vec<u8> {
        self.data.clone()
    }
}

/// Generate raw QR matrix data (0s and 1s)
/// 
/// Returns an object with { size, data } where data is a flat array
#[wasm_bindgen]
pub fn generate_matrix(text: &str, ecl: &str) -> Result<QrMatrix, JsValue> {
    let level = match ecl.to_uppercase().as_str() {
        "L" => ErrorCorrectionLevel::Low,
        "M" => ErrorCorrectionLevel::Medium,
        "Q" => ErrorCorrectionLevel::Quartile,
        "H" => ErrorCorrectionLevel::High,
        _ => return Err(JsValue::from_str("Invalid ECL")),
    };

    let qr = holi_qr::generate_qr(text, level)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(QrMatrix {
        size: qr.size(),
        data: qr.get_modules(),
    })
}

/// Get the version info for this module
#[wasm_bindgen]
pub fn qr_version() -> String {
    format!("holi-wasm-qr v{}", env!("CARGO_PKG_VERSION"))
}
