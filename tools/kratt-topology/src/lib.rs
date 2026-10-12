//! KRATT Antikythera-inspired deterministic topology experiment.
//!
//! # Security boundary
//! This crate is NOT a cipher, MAC, hash, KDF, entropy source, key generator,
//! TLS replacement, or network tunnel. Do not use diagnostic_tag as a key.
//! See README.md before connecting it to other KRATT components.
#![forbid(unsafe_code)]

use std::sync::{Mutex, OnceLock};

pub const NODE_COUNT: usize = 250;
const SEED_MULTIPLIER: u64 = 0x9E37_79B9_7F4A_7C15;
const SEED_XOR: u64 = 0xFB8D_9A1B_CE9F_8A7D;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TopologyError {
    NonFiniteInput,
    InvalidOffset,
    InvalidWeights,
    PoisonedState,
    EpochExhausted,
}

impl std::fmt::Display for TopologyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}
impl std::error::Error for TopologyError {}

/// The cultural names are design metaphors, not cryptographic assurances.
#[derive(Debug, Clone, Copy)]
pub struct TalmudDialectic {
    hillel_leniency: f64,
    shammai_rigor: f64,
}

impl TalmudDialectic {
    pub fn new(hillel_leniency: f64, shammai_rigor: f64) -> Result<Self, TopologyError> {
        if !hillel_leniency.is_finite()
            || !shammai_rigor.is_finite()
            || !(0.0..=16.0).contains(&hillel_leniency)
            || !(0.0..=16.0).contains(&shammai_rigor)
        {
            return Err(TopologyError::InvalidWeights);
        }
        Ok(Self { hillel_leniency, shammai_rigor })
    }

    /// Non-cryptographic integer mixing for observable state evolution.
    fn resolve_gemara_debate(&self, input: u64, anomaly_bits: u64) -> u64 {
        let hillel = input.wrapping_add(
            anomaly_bits.rotate_left(13) ^ self.hillel_leniency.to_bits(),
        );
        let shammai = (!input).rotate_left(7)
            ^ self.shammai_rigor.to_bits().wrapping_mul(SEED_MULTIPLIER);
        hillel ^ shammai.rotate_left(19)
    }
}

impl Default for TalmudDialectic {
    fn default() -> Self {
        Self {
            hillel_leniency: 1.618_033_988_749_895,
            shammai_rigor: std::f64::consts::PI,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct AntikytheraEngine {
    pin_offset: f64,
}

impl AntikytheraEngine {
    pub fn new(pin_offset: f64) -> Result<Self, TopologyError> {
        if !pin_offset.is_finite() || !(-1.0..=1.0).contains(&pin_offset) {
            return Err(TopologyError::InvalidOffset);
        }
        Ok(Self { pin_offset })
    }

    /// Alpha = t + e sin(t); beta = -alpha. Their sum is zero by definition,
    /// which does NOT imply constant packet density or traffic anonymity.
    pub fn calculate_orbital_skew(&self, ticks: f64) -> Result<(f64, f64), TopologyError> {
        if !ticks.is_finite() {
            return Err(TopologyError::NonFiniteInput);
        }
        let alpha = ticks + self.pin_offset * ticks.sin();
        if !alpha.is_finite() || !(2.0 * alpha).is_finite() {
            return Err(TopologyError::NonFiniteInput);
        }
        Ok((alpha, -alpha))
    }
}

impl Default for AntikytheraEngine {
    fn default() -> Self {
        Self { pin_offset: 0.1547 }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MatrixSnapshot {
    pub epoch: u64,
    pub nodes: [u64; NODE_COUNT],
}

struct MatrixState {
    epoch: u64,
    nodes: [u64; NODE_COUNT],
}

/// A mutex protects the entire 250-node transition as one coherent operation.
/// Independently relaxed atomics would not provide a consistent matrix snapshot.
pub struct ColumnNeuralMatrix {
    state: Mutex<MatrixState>,
}

impl ColumnNeuralMatrix {
    pub fn new() -> Self {
        Self {
            state: Mutex::new(MatrixState {
                epoch: 0,
                nodes: std::array::from_fn(|i| {
                    (i as u64).wrapping_mul(SEED_MULTIPLIER) ^ SEED_XOR
                }),
            }),
        }
    }

    pub fn snapshot(&self) -> Result<MatrixSnapshot, TopologyError> {
        let state = self.state.lock().map_err(|_| TopologyError::PoisonedState)?;
        Ok(MatrixSnapshot { epoch: state.epoch, nodes: state.nodes })
    }

    fn shift(
        &self,
        alpha: f64,
        beta: f64,
        dialectic: &TalmudDialectic,
    ) -> Result<(u64, u64), TopologyError> {
        let delta = (alpha - beta).abs();
        if !delta.is_finite() {
            return Err(TopologyError::NonFiniteInput);
        }
        let modifier = delta.to_bits();
        let mut state = self.state.lock().map_err(|_| TopologyError::PoisonedState)?;
        let next_epoch = state.epoch.checked_add(1).ok_or(TopologyError::EpochExhausted)?;
        let mut feedback: u64 = 0xCAFE_EBEE_FDEF_ACED;
        let mut diagnostic_tag = feedback;
        for i in 0..NODE_COUNT {
            let base = state.nodes[i]
                .wrapping_add(modifier)
                .rotate_left((i % 64) as u32)
                ^ (i as u64)
                ^ feedback;
            let evolved = dialectic.resolve_gemara_debate(base, alpha.to_bits());
            state.nodes[i] = evolved;
            feedback = evolved.rotate_left(17);
            if i % 2 == 0 {
                diagnostic_tag ^= evolved.rotate_left(13);
            } else {
                diagnostic_tag = diagnostic_tag.wrapping_add(evolved.rotate_right(7));
            }
        }
        state.epoch = next_epoch;
        Ok((state.epoch, diagnostic_tag))
    }
}

impl Default for ColumnNeuralMatrix {
    fn default() -> Self {
        Self::new()
    }
}

/// Diagnostic receipt only. Its tag has no collision-resistance or secrecy.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TopologyReceipt {
    pub epoch: u64,
    pub diagnostic_tag: u64,
    pub observed_bytes: usize,
}

pub struct SovereignSecurityBridge {
    pub matrix: ColumnNeuralMatrix,
    pub engine: AntikytheraEngine,
    pub talmud: TalmudDialectic,
}

impl SovereignSecurityBridge {
    pub fn new(engine: AntikytheraEngine, talmud: TalmudDialectic) -> Self {
        Self { matrix: ColumnNeuralMatrix::new(), engine, talmud }
    }

    /// Observe metadata, but never transform, expose, or encrypt payload bytes.
    pub fn observe(&self, observed_bytes: usize, ticks: f64) -> Result<TopologyReceipt, TopologyError> {
        let (alpha, beta) = self.engine.calculate_orbital_skew(ticks)?;
        let (epoch, diagnostic_tag) = self.matrix.shift(alpha, beta, &self.talmud)?;
        Ok(TopologyReceipt { epoch, diagnostic_tag, observed_bytes })
    }
}

impl Default for SovereignSecurityBridge {
    fn default() -> Self {
        Self::new(AntikytheraEngine::default(), TalmudDialectic::default())
    }
}

static GLOBAL_BRIDGE: OnceLock<SovereignSecurityBridge> = OnceLock::new();

pub fn global_bridge() -> &'static SovereignSecurityBridge {
    GLOBAL_BRIDGE.get_or_init(SovereignSecurityBridge::default)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deterministic_replay_of_identical_observations() {
        let left = SovereignSecurityBridge::default();
        let right = SovereignSecurityBridge::default();
        for ticks in [0.0, 1.25, -5.5, 99.0] {
            assert_eq!(left.observe(42, ticks), right.observe(42, ticks));
        }
        assert_eq!(left.matrix.snapshot().unwrap(), right.matrix.snapshot().unwrap());
    }

    #[test]
    fn complementary_orbital_vectors() {
        let (a, b) = AntikytheraEngine::default().calculate_orbital_skew(2.3).unwrap();
        assert_eq!(a + b, 0.0);
    }

    #[test]
    fn rejects_nonfinite_and_out_of_range_parameters() {
        let bridge = SovereignSecurityBridge::default();
        assert_eq!(bridge.observe(2, f64::NAN), Err(TopologyError::NonFiniteInput));
        assert_eq!(bridge.observe(2, f64::INFINITY), Err(TopologyError::NonFiniteInput));
        assert!(AntikytheraEngine::new(1.5).is_err());
        assert!(TalmudDialectic::new(f64::INFINITY, 1.0).is_err());
        assert_eq!(bridge.matrix.snapshot().unwrap().epoch, 0);
    }

    #[test]
    fn all_nodes_are_updated_in_single_coherent_transition() {
        let bridge = SovereignSecurityBridge::default();
        let before = bridge.matrix.snapshot().unwrap();
        let receipt = bridge.observe(512, 4.25).unwrap();
        let after = bridge.matrix.snapshot().unwrap();
        assert_eq!(receipt.epoch, 1);
        assert_eq!(after.epoch, 1);
        assert!(before.nodes.iter().zip(after.nodes.iter()).all(|(a,b)| a != b));
    }

    #[test]
    fn concurrent_identical_observations_match_serial_state() {
        let parallel = SovereignSecurityBridge::default();
        std::thread::scope(|scope| {
            let handles: Vec<_> = (0..8)
                .map(|_| scope.spawn(|| parallel.observe(8, 0.75).unwrap()))
                .collect();
            for h in handles {
                h.join().unwrap();
            }
        });
        let serial = SovereignSecurityBridge::default();
        for _ in 0..8 {
            serial.observe(8, 0.75).unwrap();
        }
        assert_eq!(parallel.matrix.snapshot().unwrap(), serial.matrix.snapshot().unwrap());
    }
}
