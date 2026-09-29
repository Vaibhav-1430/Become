# FORGE Mobile Asset Strategy

All visual assets and iconography follow the Stitch "Kinetic Discipline" design system:
- High-precision vector emblems and badges are implemented natively via Flutter CustomPainters (`ForgeEmblem`, `CadGridBackground`, `_GithubIconPainter`, `_GoogleIconPainter`) ensuring zero latency, zero layout shift, and pixel-perfect rendering across all screen densities.
- Typography is loaded via `google_fonts` (`Inter` and `JetBrains Mono`).
- Static raster assets (if added in future phases) belong in `assets/images/`.
