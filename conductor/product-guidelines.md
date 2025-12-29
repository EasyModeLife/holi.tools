# Product Guidelines

## Communication Style & Tone

- **Pedagogical Rigor (Mathematical Style):** Adopta un enfoque de "Ejemplo primero, Definición después". Explica conceptos complejos comenzando con casos concretos y visuales antes de formalizarlos, similar a una buena clase de matemáticas.
- **Academic yet Accessible:** El tono debe ser lo suficientemente riguroso para un _paper_ técnico pero cercano y narrativo ("storytelling") para mantener el interés.
- **Transparency:** No ocultes la complejidad; explícala. El objetivo es que el usuario entienda _por qué_ algo funciona así.

## Visual Identity & Design System

- **Clean & Premium (Swiss Style Base):** La base del diseño es minimalista, con mucho aire, tipografía clara y estructura sólida para transmitir calidad profesional.
- **Unique Tool Identities:**
  - **Holi.tools (Hub):** Multicolor, representando la unión de todas las herramientas. Mascota: **Gato**.
  - **Individual Tools:** Cada herramienta tendrá su propio color primario y una mascota animal única (ej. Calculadora: Vermillion + Cabra).
- **Decorations & Animations:** Uso permitido de elementos decorativos y animaciones para dar vida a las mascotas y romper la rigidez del minimalismo, siempre que no entorpezcan la funcionalidad.

## User Experience (UX) & Accessibility

- **Offline-First:** Funcionalidad completa sin conexión a internet es un requisito obligatorio (PWA). La única excepción son funciones inherentemente conectadas (como P2P fuera de LAN).
- **Keyboard-First (Vim-like):** Prioridad alta a la navegación y control eficiente mediante teclado para "Power Users". La interfaz debe ser cómoda y rápida de usar sin ratón.
- **Flexible Solidity:** La interfaz debe sentirse robusta, pero se prioriza la comodidad de uso sobre reglas rígidas de diseño visual.
- **Accessibility:** A11y completo es un _nice-to-have_ a largo plazo; el foco inmediato es la usabilidad por teclado y claridad visual.

## Engineering Standards

- **Strict Typing:** Uso riguroso de sistemas de tipos (Rust/TypeScript). Evitar `any` y `unwrap` inseguros para garantizar estabilidad y seguridad.
- **"Why" Documentation:** El código debe estar documentado pensando en su valor educativo. Los comentarios deben explicar la razón matemática o algorítmica detrás de una decisión, sirviendo como base directa para los _papers_ y la documentación técnica.
- **Performance Focused:** Mantener tiempos de carga rápidos como norma general. Los "presupuestos" de rendimiento son importantes pero flexibles si una característica crítica lo justifica.

## Contribution Guidelines

- **Centralized Quality Control:** Todas las contribuciones serán revisadas asistidamente por IA pero aprobadas manualmente por el mantenedor principal (tú) para asegurar la visión del proyecto.
- **Flexible Standards:** Se exigen estándares técnicos básicos (tests, tipos), pero existe flexibilidad para PRs puramente documentales o académicos (Papers).
