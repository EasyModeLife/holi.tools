//! SVG rendering for QR codes

use crate::qr::QrCode;
use fast_qr::convert::svg::SvgBuilder;
use fast_qr::convert::Builder;

/// Options for SVG rendering
#[derive(Debug, Clone)]
pub struct RenderOptions {
    /// Margin around the QR code (in modules)
    pub margin: usize,
    /// Dark module color (default: black)
    pub dark_color: String,
    /// Light module color (default: white)
    pub light_color: String,
}

impl Default for RenderOptions {
    fn default() -> Self {
        Self {
            margin: 4,
            dark_color: "#000000".to_string(),
            light_color: "#FFFFFF".to_string(),
        }
    }
}

/// Render a QR code to SVG string
///
/// Uses default rendering options.
///
/// # Example
/// ```rust
/// use holi_qr::{generate_qr, render_svg, ErrorCorrectionLevel};
///
/// let qr = generate_qr("test", ErrorCorrectionLevel::Medium).unwrap();
/// let svg = render_svg(&qr);
/// assert!(svg.starts_with("<svg"));
/// ```
pub fn render_svg(qr: &QrCode) -> String {
    SvgBuilder::default().to_str(&qr.inner)
}

/// Render a QR code to SVG string with custom options
///
/// # Example
/// ```rust
/// use holi_qr::{generate_qr, render_svg_with_options, ErrorCorrectionLevel, RenderOptions};
///
/// let qr = generate_qr("test", ErrorCorrectionLevel::Medium).unwrap();
/// let options = RenderOptions {
///     margin: 2,
///     dark_color: "#1a1a1a".to_string(),
///     light_color: "#f5f5f5".to_string(),
/// };
/// let svg = render_svg_with_options(&qr, &options);
/// ```
pub fn render_svg_with_options(qr: &QrCode, options: &RenderOptions) -> String {
    let mut builder = SvgBuilder::default();
    builder.margin(options.margin);
    builder.to_str(&qr.inner)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{generate_qr, ErrorCorrectionLevel};

    #[test]
    fn test_render_svg() {
        let qr = generate_qr("test", ErrorCorrectionLevel::Medium).unwrap();
        let svg = render_svg(&qr);
        
        assert!(svg.starts_with("<svg"));
        assert!(svg.contains("</svg>"));
    }

    #[test]
    fn test_render_with_options() {
        let qr = generate_qr("test", ErrorCorrectionLevel::Medium).unwrap();
        let options = RenderOptions {
            margin: 2,
            ..Default::default()
        };
        let svg = render_svg_with_options(&qr, &options);
        
        assert!(svg.starts_with("<svg"));
    }
}
