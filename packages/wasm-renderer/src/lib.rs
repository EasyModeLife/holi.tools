//! Holi.tools WebGPU Renderer
//! 
//! High-performance 3D rendering module using wgpu.
//! Provides animated mesh rendering with WebGPU/WebGL fallback.

mod math;
mod mesh;
mod pipeline;
mod state;

use std::{cell::RefCell, rc::Rc};
use gloo::render::{request_animation_frame, AnimationFrame};
use wasm_bindgen::prelude::*;
use web_sys::{HtmlCanvasElement, Window};

pub use state::State;

thread_local! {
    static RAF_HANDLE: RefCell<Option<AnimationFrame>> = const { RefCell::new(None) };
}

/// Start the WebGPU renderer on a canvas element.
/// 
/// # Arguments
/// * `canvas` - The HTML canvas element to render to
/// 
/// # Returns
/// Ok(()) on success, or a JsValue error on failure
#[wasm_bindgen]
#[cfg(target_arch = "wasm32")]
pub async fn start(canvas: HtmlCanvasElement) -> Result<(), JsValue> {
    console_error_panic_hook::set_once();
    
    let window = web_sys::window().ok_or("no global window")?;
    let state = State::new(&canvas).await?;
    
    let state = Rc::new(RefCell::new(state));
    let canvas = Rc::new(canvas);

    fn schedule(state: Rc<RefCell<State>>, canvas: Rc<HtmlCanvasElement>, window: Rc<Window>) {
        let handle = request_animation_frame(move |_ts| {
            let now = js_sys::Date::now();
            let start_time = state.borrow().start_time();
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

/// Stop the renderer and release resources.
#[wasm_bindgen]
#[cfg(target_arch = "wasm32")]
pub fn stop() {
    RAF_HANDLE.with(|h| {
        *h.borrow_mut() = None;
    });
}

/// Get the version info for this module
#[wasm_bindgen]
pub fn renderer_version() -> String {
    "holi-wasm-renderer v0.1.0".to_string()
}
