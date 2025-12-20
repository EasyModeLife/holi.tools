import React, { useEffect, useRef, useState } from "react";

type WebGpuStatus =
	| { kind: "idle" }
	| { kind: "unsupported"; reason: string }
	| { kind: "error"; message: string }
	| { kind: "ready" };

const shaderCode = /* wgsl */ `
struct Uniforms {
	time: f32,
	width: f32,
	height: f32,
	_pad: f32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VSOut {
	@builtin(position) pos: vec4<f32>,
	@location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vid: u32) -> VSOut {
	var positions = array<vec2<f32>, 6>(
		vec2<f32>(-1.0, -1.0),
		vec2<f32>( 1.0, -1.0),
		vec2<f32>(-1.0,  1.0),
		vec2<f32>(-1.0,  1.0),
		vec2<f32>( 1.0, -1.0),
		vec2<f32>( 1.0,  1.0),
	);
	let p = positions[vid];
	var out: VSOut;
	out.pos = vec4<f32>(p, 0.0, 1.0);
	out.uv = (p + vec2<f32>(1.0)) * 0.5;
	return out;
}

fn rot2(a: f32) -> mat2x2<f32> {
	let c = cos(a);
	let s = sin(a);
	return mat2x2<f32>(c, -s, s, c);
}

fn hueColor(t: f32) -> vec3<f32> {
	// Cheap, smooth hue cycle without branching
	return 0.55 + 0.45 * cos(6.28318 * (vec3<f32>(0.0, 0.33, 0.67) + t));
}

@fragment
fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
	let uv = in.uv;
	let w = max(u.width, 1.0);
	let h = max(u.height, 1.0);
	let aspect = w / h;
	let t = u.time;

	// Normalized pixel coords centered at (0,0)
	var p = vec2<f32>((uv.x - 0.5) * aspect, uv.y - 0.5);
	let r = length(p);

	// Background with animated border color
	let vignette = smoothstep(1.05, 0.15, r);
	let border = smoothstep(0.52, 0.42, r); // 1 in center, 0 near edges
	let edgeGlow = (1.0 - border);
	let edgeColor = hueColor(0.10 * t + r * 0.25);
	var col = (0.04 + 0.16 * vignette) * vec3<f32>(1.0);
	col += edgeGlow * edgeColor * (0.65 + 0.35 * sin(3.0 * t));

	// Central sphere (fake 3D) with "spin"
	let radius = 0.28;
	let aa = 2.0 / min(w, h);
	let sphereMask = smoothstep(radius + aa, radius - aa, r);

	if (sphereMask > 0.0) {
		// Rotate the sphere surface around center to simulate spinning
		let spin = rot2(0.9 * t);
		let pr = spin * p;
		let rr = length(pr);
		let z = sqrt(max(0.0, radius * radius - rr * rr));
		let n = normalize(vec3<f32>(pr.x, pr.y, z));

		// Rotating light direction
		let lightDir = normalize(vec3<f32>(cos(0.7 * t), 0.6, sin(0.7 * t)));
		let diff = max(0.0, dot(n, lightDir));
		let rim = pow(1.0 - max(0.0, n.z), 2.2);
		let spec = pow(max(0.0, dot(reflect(-lightDir, n), vec3<f32>(0.0, 0.0, 1.0))), 32.0);

		let base = hueColor(0.18 * t + n.x * 0.15 + n.y * 0.10);
		let sphereCol = base * (0.18 + 0.82 * diff) + rim * vec3<f32>(0.45, 0.65, 1.0) + spec * vec3<f32>(1.0);

		col = mix(col, sphereCol, sphereMask);
	}

	// Keep within [0,1]
	col = clamp(col, vec3<f32>(0.0), vec3<f32>(1.0));
	return vec4<f32>(col, 1.0);
}
`;

export function WebGpuDemo() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const rafRef = useRef<number | null>(null);
	const [status, setStatus] = useState<WebGpuStatus>({ kind: "idle" });

	useEffect(() => {
		let isDisposed = false;

		async function start() {
			const canvas = canvasRef.current;
			const container = containerRef.current;
			if (!canvas || !container) return;

			if (!("gpu" in navigator)) {
				setStatus({
					kind: "unsupported",
					reason: "Este navegador no expone navigator.gpu (WebGPU).",
				});
				return;
			}

			try {
				const adapter = await navigator.gpu.requestAdapter({
					powerPreference: "high-performance",
				});
				if (!adapter) {
					setStatus({
						kind: "unsupported",
						reason: "No se pudo obtener un GPUAdapter.",
					});
					return;
				}

				const device = await adapter.requestDevice();
				if (isDisposed) return;

				const context = canvas.getContext("webgpu");
				if (!context) {
					setStatus({
						kind: "unsupported",
						reason: "No se pudo crear el contexto WebGPU en el canvas.",
					});
					return;
				}
				const gpuContext: GPUCanvasContext = context;

				const format = navigator.gpu.getPreferredCanvasFormat();
				const maxDim2D = device.limits.maxTextureDimension2D;
				const config: GPUCanvasConfiguration = {
					device,
					format,
					alphaMode: "premultiplied",
				};

				function resizeToDisplaySize(targetCanvas: HTMLCanvasElement, targetContainer: HTMLDivElement) {
					const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
					const rect = targetContainer.getBoundingClientRect();
					const cssWidth = Math.max(
						1,
						Math.floor(targetContainer.clientWidth || rect.width)
					);
					const cssHeight = Math.max(
						1,
						Math.floor(targetContainer.clientHeight || rect.height)
					);

					let width = Math.max(1, Math.floor(cssWidth * dpr));
					let height = Math.max(1, Math.floor(cssHeight * dpr));

					if (width > maxDim2D || height > maxDim2D) {
						const scale = Math.min(maxDim2D / width, maxDim2D / height);
						width = Math.max(1, Math.floor(width * scale));
						height = Math.max(1, Math.floor(height * scale));
					}

					const changed =
						targetCanvas.width !== width || targetCanvas.height !== height;
					if (changed) {
						targetCanvas.width = width;
						targetCanvas.height = height;
						// Some implementations require re-configure after resize.
						gpuContext.configure(config);
					}

					return { width, height, changed };
				}

				gpuContext.configure(config);

				const shaderModule = device.createShaderModule({ code: shaderCode });
				const pipeline = device.createRenderPipeline({
					layout: "auto",
					vertex: { module: shaderModule, entryPoint: "vs_main" },
					fragment: {
						module: shaderModule,
						entryPoint: "fs_main",
						targets: [{ format }],
					},
					primitive: { topology: "triangle-list" },
				});

				// Uniforms: time, width, height, pad
				const uniformBuffer = device.createBuffer({
					size: 4 * 4,
					usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
				});

				const bindGroup = device.createBindGroup({
					layout: pipeline.getBindGroupLayout(0),
					entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
				});

				setStatus({ kind: "ready" });

				const t0 = performance.now();
				const draw = () => {
					if (isDisposed) return;
					const { width, height } = resizeToDisplaySize(canvas, container);
					const time = (performance.now() - t0) / 1000;

					device.queue.writeBuffer(
						uniformBuffer,
						0,
						new Float32Array([time, width, height, 0])
					);

					const encoder = device.createCommandEncoder();
					const pass = encoder.beginRenderPass({
						colorAttachments: [
							{
								view: gpuContext.getCurrentTexture().createView(),
								clearValue: { r: 0, g: 0, b: 0, a: 1 },
								loadOp: "clear",
								storeOp: "store",
							},
						],
					});
					pass.setPipeline(pipeline);
					pass.setBindGroup(0, bindGroup);
					pass.draw(6);
					pass.end();

					device.queue.submit([encoder.finish()]);
					rafRef.current = requestAnimationFrame(draw);
				};

				rafRef.current = requestAnimationFrame(draw);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				setStatus({ kind: "error", message });
			}
		}

		void start();
		return () => {
			isDisposed = true;
			if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
		};
	}, []);

	return (
		<div className="w-full max-w-3xl pointer-events-auto">
			<div className="flex items-center justify-between gap-3 mb-2">
				<div>
					<h2 className="text-white font-semibold text-lg">WebGPU Demo</h2>
					<p className="text-white/70 text-sm">
						Render local en tu GPU. Sin servidores.
					</p>
				</div>
				<div className="text-xs text-white/60">
					{status.kind === "ready" && "Activo"}
					{status.kind === "idle" && "Iniciando…"}
					{status.kind === "unsupported" && "No soportado"}
					{status.kind === "error" && "Error"}
				</div>
			</div>

			<div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur">
				<div
					ref={containerRef}
					className="w-full"
					style={{ aspectRatio: "16 / 9" }}
				>
					<canvas
						ref={canvasRef}
						className="block"
						style={{ width: "100%", height: "100%" }}
						aria-label="WebGPU demo canvas"
					/>
				</div>
				{status.kind === "unsupported" ? (
					<div className="p-4 text-sm text-white/80">
						<div className="font-medium text-white mb-1">
							WebGPU no disponible
						</div>
						<div className="text-white/70">{status.reason}</div>
						<div className="text-white/60 mt-2">
							Tip: prueba Chrome/Edge reciente y habilita WebGPU.
						</div>
					</div>
				) : null}
				{status.kind === "error" ? (
					<div className="p-4 text-sm text-white/80">
						<div className="font-medium text-white mb-1">Falló al iniciar</div>
						<div className="text-white/70 break-words">{status.message}</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
