# ⛓️ AÑO 4 - FASE 2: BLOCKCHAIN FUNDAMENTALS (Semanas 11-20)

## Plan de Trabajo Año 4 - Héroes del Metaverso

---

## SEMANA 11: BLOCKCHAIN ENVIRONMENT SETUP

**Objetivo:** Configurar el entorno de desarrollo Web3.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Inicializar proyecto Hardhat/Foundry | Blockchain | CRÍTICA | ✅ |
| 2 | Configurar redes (Localhost, Sepolia/Amoy Testnet) | Blockchain | CRÍTICA | ✅ |
| 3 | Instalar OpenZeppelin Contracts | Blockchain | CRÍTICA | ✅ |
| 4 | Configurar TypeScript para Smart Contracts | Tooling | ALTA | ✅ |
| 5 | Crear scripts de despliegue automatizado | DevOps | ALTA | ✅ |
| 6 | Integrar Ethers.js v6 en el Backend | Backend | CRÍTICA | ✅ |
| 7 | Configurar proveedor de nodos (Infura/Alchemy) | Infra | ALTA | ✅ |
| 8 | Crear wallets de desarrollo y faucets | Blockchain | MEDIA | ✅ |
| 9 | Implementar sistema de gestión de claves (Environment vars) | Security | CRÍTICA | ✅ |
| 10 | Configurar Gas Reporter para tests | Tooling | MEDIA | ✅ |
| 11 | Crear CI/CD pipeline para contratos (Compile check) | DevOps | ALTA | ✅ |
| 12 | Investigar Layer 2 Scaling (Polygon vs Arbitrum) | Research | ALTA | ✅ |
| 13 | Documentar arquitectura de contratos propuesta | Docs | ALTA | ✅ |
| 14 | Escribir "Hello World" Contract y desplegarlo en local | Blockchain | BAJA | ✅ |

---

## SEMANA 12: TOKENOMICS CORE (ERC-20)

**Objetivo:** Crear la moneda del ecosistema "IACoins".

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Diseñar Tokenomics (Supply, Vesting, Utility) | Design | CRÍTICA | ✅ |
| 2 | Programar contrato ERC-20 `IACoin.sol` (Permit, Burnable) | Blockchain | CRÍTICA | ✅ |
| 3 | Implementar lógica de "Minting" controlado (RoleBased) | Blockchain | CRÍTICA | ✅ |
| 4 | Crear Test Suite exhaustivo para el Token | Testing | CRÍTICA | ✅ |
| 5 | Desplegar Token en Testnet | Blockchain | ALTA | ✅ |
| 6 | Verificar contrato en Etherscan/PolygonScan | Blockchain | MEDIA | ✅ |
| 7 | Crear Swap Service simulado en Backend (Base de datos -> Blockchain) | Backend | ALTA | ✅ |
| 8 | Implementar listener de eventos `Transfer` | Backend | ALTA | ✅ |
| 9 | Diseñar icono y branding del Token | Design | BAJA | ✅ |
| 10 | Integrar Token en la UI del Dashboard (Vista de solo lectura) | Frontend | ALTA | ✅ |
| 11 | Escribir script de distribución inicial (Airdrop simulado) | Blockchain | MEDIA | ✅ |
| 12 | Implementar protección contra reentrancy básica | Security | CRÍTICA | ✅ |
| 13 | Documentar funciones públicas del Token | Docs | MEDIA | ✅ |
| 14 | Crear Faucet web para usuarios de prueba | Frontend | MEDIA | ✅ |

---

## SEMANA 13: IDENTITY & WALLETS

**Objetivo:** Conectar el usuario Web2 con Web3.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Integrar Web3Modal / RainbowKit en Frontend | Frontend | CRÍTICA | ✅ |
| 2 | Implementar "Sign-In with Ethereum" (SIWE) | Security | CRÍTICA | ✅ |
| 3 | Vincular Wallet Address con User ID (PostgreSQL) | Backend | CRÍTICA | ✅ |
| 4 | Crear Soulbound Token (SBT) para "Identidad Estudiantil" | Blockchain | ALTA | ✅ |
| 5 | Implementar minting de SBT al registrarse | Blockchain | ALTA | ✅ |
| 6 | Diseñar perfil de usuario Web3 (Badge Display) | Frontend | MEDIA | ✅ |
| 7 | Gestionar estados de conexión de Wallet (Loading, Error) | Frontend | MEDIA | ✅ |
| 8 | Implementar detección de cambio de red (Forzar cadena correcta) | Frontend | ALTA | ✅ |
| 9 | Crear servicio de resolución de nombres (ENS-lite interno) | Blockchain | BAJA | ✅ |
| 10 | Encriptar metadatos de identidad en IPFS (opcional) | Blockchain | ALTA | ✅ |
| 11 | Crear hook `useWallet` personalizado | Frontend | MEDIA | ✅ |
| 12 | Testear flujo de login en móviles (MetaMask Mobile) | Testing | CRÍTICA | ✅ |
| 13 | Implementar botón de desconexión seguro | Frontend | BAJA | ✅ |
| 14 | Escribir guía "Tu primera Wallet" para estudiantes | Docs | MEDIA | ✅ |

---

## SEMANA 14: SMART DIPLOMAS (NFTs)

**Objetivo:** Certificados académicos inmutables.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Diseñar estándar de metadata para Diplomas (ERC-721 vs 1155) | Design | CRÍTICA | ✅ |
| 2 | Programar contrato `AcademyCredential.sol` | Blockchain | CRÍTICA | ✅ |
| 3 | Implementar almacenamiento en IPFS/Pinata | Infra | ALTA | ✅ |
| 4 | Crear sistema de generación de imágenes de diplomas dinámicos | Backend | ALTA | ✅ |
| 5 | Implementar función `issueCredential` (Solo Admin) | Blockchain | CRÍTICA | ✅ |
| 6 | Crear visor de Diplomas en Frontend | Frontend | ALTA | ✅ |
| 7 | Implementar verificación de autenticidad on-chain | Frontend | CRÍTICA | ✅ |
| 8 | Permitir compartir diploma en LinkedIn (URL pública) | Feature | MEDIA | ✅ |
| 9 | Crear script de migración de logros antiguos a NFTs | Blockchain | MEDIA | ✅ |
| 10 | Implementar "Burn" de credenciales (Revocación) | Blockchain | ALTA | ✅ |
| 11 | Optimizar gas de minting masivo (Batch Minting) | Blockchain | ALTA | ✅ |
| 12 | Testear compatibilidad con OpenSea (Testnet) | Testing | BAJA | ✅ |
| 13 | Crear colección de "Medallas de Honor" (Season 1) | Design | BAJA | ✅ |
| 14 | Escribir tests para el contrato de credenciales | Testing | ALTA | ✅ |

---

## SEMANA 15: SECURITY & TESTING

**Objetivo:** Fortificar la capa Blockchain.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Implementar Slither para análisis estático | Security | CRÍTICA | ✅ |
| 2 | Configurar Echidna para Fuzzing | Security | ALTA | ✅ |
| 3 | Realizar auditoría interna de control de accesos (Ownable/Roles) | Security | CRÍTICA | ✅ |
| 4 | Implementar patrón Pausable en todos los contratos | Blockchain | ALTA | ✅ |
| 5 | Revisar lógica matemática (Overflows aunque Solidity 0.8+ proteja) | Security | MEDIA | ✅ |
| 6 | Crear escenarios de ataque en tests (Hacks simulados) | Testing | ALTA | ✅ |
| 7 | Implementar TimeLocks para operaciones sensibles | Blockchain | ALTA | ✅ |
| 8 | Configurar monitoreo de eventos sospechosos (OpenZeppelin Defender) | Infra | ALTA | ✅ |
| 9 | Validar inputs en frontend antes de enviar transacción | Frontend | MEDIA | ✅ |
| 10 | Optimizar uso de `storage` vs `memory` | Blockchain | MEDIA | ✅ |
| 11 | Revisar dependencias npm por vulnerabilidades | Security | ALTA | ✅ |
| 12 | Documentar plan de respuesta a incidentes | Docs | CRÍTICA | ✅ |
| 13 | Crear Bounty Program simulado (Bug Hunting interno) | Social | BAJA | ✅ |
| 14 | Generar reporte de cobertura de tests (Coverage > 95%) | Testing | ALTA | ✅ |

---

## SEMANA 16: GAS OPTIMIZATION & L2

**Objetivo:** Hacer el sistema económicamente viable.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Analizar consumo de gas de funciones principales | Profiling | CRÍTICA | ✅ |
| 2 | Migrar a Polygon Amoy o Arbitrum Sepolia definitivamente | Blockchain | CRÍTICA | ✅ |
| 3 | Implementar Meta-Transactions (Gasless para usuarios) | Blockchain | CRÍTICA | ✅ |
| 4 | Configurar Biconomy o OpenGSN Relayer | Infra | ALTA | ✅ |
| 5 | Optimizar estructuras de datos en Solidity (packing) | Blockchain | ALTA | ✅ |
| 6 | Refactorizar bucles costosos en contratos | Blockchain | ALTA | ✅ |
| 7 | Cargar "Gas Tank" del Relayer | Blockchain | MEDIA | ✅ |
| 8 | Implementar caché de datos on-chain en The Graph | Backend | ALTA | ✅ |
| 9 | Crear Subgraph para indexar eventos del proyecto | Blockchain | ALTA | ✅ |
| 10 | Configurar RPCs privados para mayor estabilidad | Infra | MEDIA | ✅ |
| 11 | Comparar costos L1 vs L2 en reporte | Docs | BAJA | ✅ |
| 12 | Implementar estrategias de "Off-chain signing" (EIP-712) | Blockchain | ALTA | ✅ |
| 13 | Testear flujo Gasless completo en UI | Frontend | CRÍTICA | ✅ |
| 14 | Monitorear latencia de confirmación de bloques | DevOps | MEDIA | ✅ |

---

## SEMANA 17: BACKEND INTEGRATION WEB3

**Objetivo:** El servidor como oráculo y puente.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Finalizar arquitectura Event-Driven para Blockchain | Backend | CRÍTICA | ✅ |
| 2 | Implementar cola de trabajos para transacciones (BullMQ) | Backend | ALTA | ✅ |
| 3 | Crear servicio de firma de transacciones (Signer Service) | Backend | CRÍTICA | ✅ |
| 4 | Proteger llaves privadas en servidor (Vault/AWS KMS) | Security | CRÍTICA | ✅ |
| 5 | Sincronizar saldo on-chain con base de datos local (Cache) | Backend | ALTA | ✅ |
| 6 | Implementar Webhooks para notificar confirmaciones | Backend | MEDIA | ✅ |
| 7 | Crear API `/api/web3/gas-price` (Estimador) | Backend | MEDIA | ✅ |
| 8 | Implementar reintentos automáticos para tx fallidas | Backend | ALTA | ✅ |
| 9 | Validar firmas criptográficas en endpoints API | Backend | Security | ✅ |
| 10 | Crear logs específicos para trazabilidad Blockchain | Backend | MEDIA | ✅ |
| 11 | Implementar Health Check de nodos RPC | Backend | MEDIA | ✅ |
| 12 | Crear dashboard de administración de Smart Contracts | Admin | BAJA | ✅ |
| 13 | Escribir tests de integración Backend-Blockchain | Testing | ALTA | ✅ |
| 14 | Documentar API Web3 interna | Docs | BAJA | ✅ |

---

## SEMANA 18: FRONTEND WALLET UI

**Objetivo:** Experiencia de usuario cripto amigable.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Rediseñar Navbar para incluir estado de Wallet | Design | ALTA | ✅ |
| 2 | Crear componente `WalletConnectButton` estilizado | Frontend | ALTA | ✅ |
| 3 | Implementar visualización de saldo en tiempo real | Frontend | ALTA | ✅ |
| 4 | Crear historial de transacciones en perfil | Frontend | MEDIA | ✅ |
| 5 | Diseñar modales de confirmación de transacción claros | UI | CRÍTICA | ✅ |
| 6 | Implementar notificaciones "Toast" para estados de tx (Pending, Success) | UI | ALTA | ✅ |
| 7 | Crear página "Mis Activos Digitales" (Portafolio) | Frontend | ALTA | ✅ |
| 8 | Implementar visualizador de NFTs (Diplomas/Items) | Frontend | MEDIA | ✅ |
| 9 | Añadir convertidor de unidades (Wei <-> Ether) | Utils | BAJA | ✅ |
| 10 | Implementar skeleton loading para datos Web3 | UI | MEDIA | ✅ |
| 11 | Gestionar errores de RPC amigablemente | Frontend | MEDIA | ✅ |
| 12 | Crear animaciones para transacciones exitosas | UI | BAJA | ✅ |
| 13 | Soportar múltiples idiomas en mensajes Web3 | i18n | BAJA | ✅ |
| 14 | Realizar pruebas de usabilidad con usuarios no-técnicos | Testing | ALTA | ✅ |

---

## SEMANA 19: FAUCET & TESTNET LAUNCH

**Objetivo:** Preparar el entorno para pruebas masivas.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Desplegar todos los contratos en Red de Pruebas estable | DevOps | CRÍTICA | ✅ |
| 2 | Configurar dominio `testnet.heroes.edu` | Infra | MEDIA | ✅ |
| 3 | Implementar lógica de Faucet (Drip Rate, Cooldown) | Backend | ALTA | ✅ |
| 4 | Crear página de Faucet con Captcha | Frontend | ALTA | ✅ |
| 5 | Verificación de contratos en el explorador de bloques | Blockchain | MEDIA | ✅ |
| 6 | Crear guía "Cómo obtener IACoins de prueba" | Docs | ALTA | ✅ |
| 7 | Sembrar datos iniciales (Usuarios bot, transacciones) | Scripts | MEDIA | ✅ |
| 8 | Monitorear estabilidad de la red elegida | DevOps | MEDIA | ✅ |
| 9 | Configurar alertas de saldo bajo en Faucet Wallet | Ops | ALTA | ✅ |
| 10 | Implementar estadísticas del Faucet en tiempo real | Frontend | BAJA | ✅ |
| 11 | Crear video tutorial de setup para alumnos | Content | MEDIA | ✅ |
| 12 | Abrir acceso a un grupo cerrado de beta testers | Mgmt | MEDIA | ✅ |
| 13 | Recopilar feedback inicial sobre velocidad/UX | Research | ALTA | ✅ |
| 14 | Ajustar parámetros de gas limit según pruebas | Blockchain | ALTA | ✅ |

---

## SEMANA 20: BETA INTEGRATION REVIEW

**Objetivo:** Integración final y pulido de la Fase 2.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Auditoría completa de integración Frontend-Backend-Blockchain | Review | CRÍTICA | ✅ |
| 2 | Optimizar tiempos de carga inicial (Lazy loading de librerías Web3) | Frontend | ALTA | ✅ |
| 3 | Resolver bugs reportados en Beta Testing | Bugfix | CRÍTICA | ✅ |
| 4 | Refinar textos y mensajes de error | UX | MEDIA | ✅ |
| 5 | Asegurar compatibilidad móvil al 100% | Mobile | CRÍTICA | ✅ |
| 6 | Actualizar documentación técnica final de Fase 2 | Docs | MEDIA | ✅ |
| 7 | Planificar migración de datos a producción (Mainnet plan) | Planning | ALTA | ✅ |
| 8 | Limpiar código muerto y logs de debug | Maint | BAJA | ✅ |
| 9 | Taggear versión `v2.0-blockchain-beta` en Git | Git | BAJA | ✅ |
| 10 | Realizar demostración al equipo directivo | Demo | ALTA | ✅ |
| 11 | Evaluar costos operativos proyectados | Finance | ALTA | ✅ |
| 12 | Celebrar el primer bloque minado de la "Uni-Chain" | Social | BAJA | ✅ |
| 13 | Preparar backlog para Fase 3 (Metaverso + Blockchain) | Planning | MEDIA | ✅ |
| 14 | Descanso y retrospectiva del equipo | Agile | BAJA | ✅ |

---

## 🎉 FASE 2 COMPLETADA - 140/140 TAREAS (100%)

**Fecha de Finalización:** 15 de Enero de 2026

**Próximo archivo:** `PLAN_AÑO4_FASE3_SEM21-30.md` (Virtual Campus Integration)
