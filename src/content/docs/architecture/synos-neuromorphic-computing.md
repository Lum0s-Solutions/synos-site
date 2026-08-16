# synos-neuromorphic-computing — Spiking Neural Network Framework

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-neuromorphic-computing/`  
**Milestone:** v41+  
**License:** MIT OR Apache-2.0

## What It Is

`synos-neuromorphic-computing` provides the full neuromorphic computing
framework for Syn_OS. It implements spiking neural networks (SNNs) with multiple
neuron models, synaptic plasticity, and homeostatic scaling. This is the
computation engine behind ALFRED's Neuromorphic consciousness path.

## Architecture

### Neuron Models

| Model | Description |
|-------|-------------|
| `LIF` | Leaky Integrate-and-Fire |
| `Izhikevich` | Izhikevich model |
| `HodgkinHuxley` | Hodgkin-Huxley model |
| `AdEx` | Adaptive Exponential Integrate-and-Fire |
| `SRM` | Spike Response Model |

### Synapse

`Synapse` represents a connection between neurons with:
- Weight (synaptic strength)
- Plasticity rules (STDP)
- Delay (conduction delay)

### Key Types

- `ConsciousnessState` — shared state type from `synos-consciousness-types`
- `NeuronModel` — enum of supported neuron models
- `Synapse` — synaptic connection with plasticity

## How It's Wired

### Integration Points

1. **ALFRED cortex** — `CortexAdapter` delegates to this crate for SNN inference
2. **synos-consciousness-types** — shares `ConsciousnessState` type
3. **synos-cortex-q** — alternative backend (MPS tensor-network) for QuantumInspired path
4. **Criterion benchmarks** — performance regression suite included

## Future Ideas

1. **Online learning** — real-time STDP during inference
2. **Homeostatic scaling** — automatic neuron excitability regulation
3. **Multi-compartment neurons** — spatially extended neuron models
4. **Hardware acceleration** — GPU/TPU kernel for large-scale SNN simulation
