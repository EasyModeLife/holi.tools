//! Holi.tools QR Code Generator
//! 
//! Lightweight WASM module for generating QR codes as SVG.
//! Uses fast_qr for high-performance QR generation.

use wasm_bindgen::prelude::*;
use fast_qr::convert::svg::SvgBuilder;
use fast_qr::qr::QRBuilder;
use fast_qr::ECL;

/// Generate a QR code as an SVG string.
/// 
/// # Arguments
/// * `text` - The text/URL to encode
/// 
/// # Returns
/// SVG string representation of the QR code
#[wasm_bindgen]
pub fn generate_qr_svg(text: &str) -> Result<String, JsValue> {
    let qrcode = QRBuilder::new(text)
        .ecl(ECL::M) // Medium error correction
        .build()
        .map_err(|e| JsValue::from_str(&format!("QR generation failed: {:?}", e)))?;

    let svg = SvgBuilder::default()
        .to_str(&qrcode);

    Ok(svg)
}

/// Generate a QR code with custom error correction level.
/// 
/// # Arguments
/// * `text` - The text/URL to encode
/// * `ecl` - Error correction level: "L", "M", "Q", or "H"
/// 
/// # Returns
/// SVG string representation of the QR code
#[wasm_bindgen]
pub fn generate_qr_svg_with_ecl(text: &str, ecl: &str) -> Result<String, JsValue> {
    let error_level = match ecl.to_uppercase().as_str() {
        "L" => ECL::L, // ~7% recovery
        "M" => ECL::M, // ~15% recovery
        "Q" => ECL::Q, // ~25% recovery
        "H" => ECL::H, // ~30% recovery
        _ => return Err(JsValue::from_str("Invalid ECL. Use: L, M, Q, or H")),
    };

    let qrcode = QRBuilder::new(text)
        .ecl(error_level)
        .build()
        .map_err(|e| JsValue::from_str(&format!("QR generation failed: {:?}", e)))?;

    let svg = SvgBuilder::default()
        .to_str(&qrcode);

    Ok(svg)
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

/// Generate raw QR matrix data
#[wasm_bindgen]
pub fn generate_matrix(text: &str, ecl: &str) -> Result<QrMatrix, JsValue> {
    generate_matrix_with_mask(text, ecl, -1) // -1 means auto
}

/// Generate raw QR matrix data with specific mask pattern
/// mask: 0-7 for specific pattern, -1 for auto
#[wasm_bindgen]
pub fn generate_matrix_with_mask(text: &str, ecl: &str, mask: i32) -> Result<QrMatrix, JsValue> {
    use fast_qr::Mask;
    
    let error_level = match ecl.to_uppercase().as_str() {
        "L" => ECL::L, "M" => ECL::M, "Q" => ECL::Q, "H" => ECL::H,
        _ => return Err(JsValue::from_str("Invalid ECL")),
    };

    // Build QR code with optional mask
    let qrcode = if mask >= 0 && mask <= 7 {
        let mask_pattern = match mask {
            0 => fast_qr::Mask::Checkerboard,
            1 => fast_qr::Mask::HorizontalLines,
            2 => fast_qr::Mask::VerticalLines,
            3 => fast_qr::Mask::DiagonalLines,
            4 => fast_qr::Mask::LargeCheckerboard,
            5 => fast_qr::Mask::Fields,
            6 => fast_qr::Mask::Diamonds,
            7 => fast_qr::Mask::Meadow,
            _ => fast_qr::Mask::Checkerboard,
        };
        QRBuilder::new(text)
            .ecl(error_level)
            .mask(mask_pattern)
            .build()
    } else {
        QRBuilder::new(text)
            .ecl(error_level)
            .build()
    }.map_err(|e| JsValue::from_str(&format!("Gen failed: {:?}", e)))?;

    // fast_qr stores data as [Module; N]
    // We need to convert to flat Vec<u8> (0/1)
    let data: Vec<u8> = qrcode.data.iter()
        .map(|m| (m.0 & 1) as u8)
        .collect();

    Ok(QrMatrix {
        size: qrcode.size,
        data,
    })
}

/// Get the version info for this module
#[wasm_bindgen]
pub fn qr_version() -> String {
    "holi-wasm-qr v0.3.0 (mask support)".to_string()
}
