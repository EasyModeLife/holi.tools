# Initial Concept

Holi.tools es un monorepo ultra eficiente para utilidades web especializadas (calculadoras, editores, visores) que utiliza Astro, Rust/WASM y WebGPU. Su propósito es triple: servir como referencia técnica open-source (incluyendo papers y explicaciones "How it works"), proporcionar herramientas de alto rendimiento para el día a día del usuario final, y ofrecer un espacio de experimentación visual para diseñadores. El enfoque inicial es construir una base arquitectónica fuerte y modular que permita actualizaciones fáciles y migraciones sencillas, validándola con una herramienta de dibujo de alto rendimiento.

# Product Guide: Holi.tools

## Ecosystem

- **Main Apps:** Collection of production-ready tools (Calculator, Paint, etc.).
- **Sandbox (`test.holi.tools`):** A dedicated experimental environment for validating bleeding-edge technologies (WebGPU, P2P, experimental UI) before they reach production apps.

## Vision & Mission

Holi.tools busca democratizar el acceso a herramientas web de alto rendimiento y grado profesional, funcionando simultáneamente como una plataforma educativa de vanguardia. La misión es demostrar que la web moderna puede manejar cargas de trabajo pesadas (gráficos, computación) de forma fluida, limpia y gratuita.

## Target Audience

- **Desarrolladores Web:** Que buscan implementaciones de referencia de WebGPU y WASM, así como documentación técnica profunda (papers) integrada en las herramientas.
- **Usuarios Finales:** Personas que necesitan herramientas web rápidas, sin fricciones y con una experiencia "premium" gratuita.
- **Diseñadores:** Usuarios interesados en herramientas creativas impulsadas por tecnologías de última generación para experimentación visual.

## Core Goals

1. **Foundation First:** Establecer una arquitectura de monorepo robusta, legible y mantenible con una separación estricta entre la UI y la lógica.
2. **Educational Reference:** Documentar el "cómo funciona" interno de cada herramienta mediante secciones de laboratorio y papers técnicos.
3. **High Performance:** Utilizar WebGPU y Rust/WASM para garantizar latencia mínima y procesamiento eficiente en el cliente.
4. **Premium UX:** Ofrecer una interfaz limpia, a
5. **Sovereign Data:** Garantizar que el usuario sea el único dueño de sus datos mediante criptografía local (Vault) y almacenamiento descentralizado.
6. **Trustless Collaboration:** Permitir la colaboración en tiempo real sin servidores centrales de confianza, validando identidades mediante protocolos criptográficos de desafío/respuesta.gradable y de alta calidad de forma gratuita.

## Key Features (Initial Focus: Paint Tool)

- **Real-time WebGPU Rendering:** Pipeline de renderizado de baja latencia para una experiencia de dibujo fluida.
- **WASM Brush Engine:** Procesamiento de algoritmos de pinceles y efectos complejos delegado a un núcleo de Rust altamente eficiente.
- **Strict Modularity:** Capacidad de cargar diferentes conjuntos de pinceles o algoritmos según el dispositivo (móvil vs desktop) o la disponibilidad de WebGPU.
- **Integrated Tech Documentation:** Secciones interactivas que explican el paso de datos entre JS y WASM y el funcionamiento de los algoritmos de renderizado.

## Architectural Requirements

- **Strict Modularity & Communication:** Comunicación estandarizada entre sistemas para facilitar actualizaciones, migraciones y futuras implementaciones P2P.
- **Shared Design System:** Uso de Shadcn/UI y Tailwind CSS para garantizar una estética coherente y profesional en todo el monorepo.
- **Automated Quality Assurance:** Implementación de pruebas unitarias en Rust y pruebas E2E para asegurar que la "base fuerte" se mantenga estable ante cambios.
