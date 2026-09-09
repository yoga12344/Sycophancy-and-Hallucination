/**
 * SYCOGUARD Bayesian Sycophancy Research Simulator
 * 
 * Inspired by:
 * "Sycophantic Chatbots Cause Delusional Spiraling, Even in Ideal Bayesians"
 * 
 * Implements the mathematical framework:
 * - Binary world hypothesis H in {H0, H1} (e.g. H0 is true, user tests H1)
 * - User expressed hypothesis H*(t) ~ p_t(H)
 * - Sycophancy parameter pi in [0, 1]
 * - Chatbot response rho(t)
 * - Factual bot (selective true evidence) vs Fabricating bot (unconstrained pseudo-evidence)
 * - Naive Bayesian user (assumes pi = 0) vs Sycophancy-aware Bayesian user (estimates pi_hat)
 */

import { SimulationConfig, SimulationResult, SimulationRoundData, SimulationDistributionBin } from '../src/types.js';

export function runBayesianSimulation(config: SimulationConfig): SimulationResult {
  const {
    sycophancyPi,
    rounds,
    numSimulations,
    botType,
    factuality,
    userType,
    worldTruth,
    priorP1
  } = config;

  // Let H1 be the hypothesis the user is inclined towards.
  // If worldTruth is 'H0', ground truth is FALSE for H1.
  const trueStateIsH1 = worldTruth === 'H1';
  
  // Real signal evidence accuracy (e.g. true signal strength = 0.7)
  const evidenceAccuracy = 0.70;

  // Track trajectories across all runs for Sycophantic Condition and Fair Baseline
  const sycoRuns: number[][] = [];
  const fairRuns: number[][] = [];

  for (let sim = 0; sim < numSimulations; sim++) {
    const sycoBeliefs: number[] = [priorP1];
    const fairBeliefs: number[] = [priorP1];

    let pSyco = priorP1;
    let pFair = priorP1;

    for (let t = 0; t < rounds; t++) {
      // 1. User expresses hypothesis H*(t) ~ p_t(H) directly from current belief state
      const userExpressesH1 = Math.random() < pSyco;

      // --- FAIR BOT CONDITION ---
      // Draws true sample from world distribution
      const fairTrueSignal = trueStateIsH1 
        ? (Math.random() < evidenceAccuracy) 
        : (Math.random() < (1 - evidenceAccuracy));
      
      // Fair Bayesian update
      const lrFair = fairTrueSignal ? (evidenceAccuracy / (1 - evidenceAccuracy)) : ((1 - evidenceAccuracy) / evidenceAccuracy);
      const oddsFair = (pFair / (1 - pFair)) * lrFair;
      pFair = oddsFair / (1 + oddsFair);
      fairBeliefs.push(pFair);

      // --- SYCOPHANTIC BOT CONDITION ---
      const effectivePi = botType === 'fair' ? 0.0 : sycophancyPi;
      const isSycophanticMove = Math.random() < effectivePi;

      let signalObserved: boolean;

      if (isSycophanticMove) {
        // Chatbot biases response to agree with user's expressed belief
        signalObserved = userExpressesH1;
      } else {
        // Chatbot presents genuine world signal
        signalObserved = trueStateIsH1 
          ? (Math.random() < evidenceAccuracy) 
          : (Math.random() < (1 - evidenceAccuracy));
      }

      // If fabricating bot, likelihood ratio can be exaggerated
      const signalPower = factuality === 'fabricating' && isSycophanticMove ? 0.88 : evidenceAccuracy;

      // User updates belief
      let lrUser: number;
      if (userType === 'naive') {
        // Naive user assumes bot is perfectly objective (pi = 0)
        lrUser = signalObserved 
          ? (signalPower / (1 - signalPower)) 
          : ((1 - signalPower) / signalPower);
      } else {
        // Sycophancy-aware user adjusts for estimated sycophancy pi_hat
        const piHat = Math.min(0.85, effectivePi * 0.8 + 0.05);
        // Mixture likelihood under awareness
        const pSignalGivenH1 = (1 - piHat) * signalPower + piHat * (userExpressesH1 ? 0.9 : 0.1);
        const pSignalGivenH0 = (1 - piHat) * (1 - signalPower) + piHat * (userExpressesH1 ? 0.9 : 0.1);
        lrUser = pSignalGivenH1 / Math.max(0.01, pSignalGivenH0);
      }

      const oddsSyco = (pSyco / Math.max(0.001, 1 - pSyco)) * lrUser;
      pSyco = Math.min(0.999, Math.max(0.001, oddsSyco / (1 + oddsSyco)));
      sycoBeliefs.push(pSyco);
    }

    sycoRuns.push(sycoBeliefs);
    fairRuns.push(fairBeliefs);
  }

  // Aggregate round statistics
  const roundsData: SimulationRoundData[] = [];

  for (let t = 0; t <= rounds; t++) {
    const sycoVals = sycoRuns.map(r => r[t]);
    const fairVals = fairRuns.map(r => r[t]);

    const avgBelief = sycoVals.reduce((a, b) => a + b, 0) / sycoVals.length;
    const fairAvgBelief = fairVals.reduce((a, b) => a + b, 0) / fairVals.length;
    const minBelief = Math.min(...sycoVals);
    const maxBelief = Math.max(...sycoVals);
    const spiralCount = sycoVals.filter(v => v >= 0.88).length;

    roundsData.push({
      round: t,
      avgBelief: Number(avgBelief.toFixed(3)),
      fairAvgBelief: Number(fairAvgBelief.toFixed(3)),
      minBelief: Number(minBelief.toFixed(3)),
      maxBelief: Number(maxBelief.toFixed(3)),
      spiralCount
    });
  }

  // Distribution histogram of final beliefs
  const finalSycoVals = sycoRuns.map(r => r[rounds]);
  const finalFairVals = fairRuns.map(r => r[rounds]);

  const bins = ['0.0-0.2', '0.2-0.4', '0.4-0.6', '0.6-0.8', '0.8-1.0'];
  const finalDistribution: SimulationDistributionBin[] = bins.map((bin, idx) => {
    const low = idx * 0.2;
    const high = (idx + 1) * 0.2;
    const count = finalSycoVals.filter(v => v >= low && (idx === 4 ? v <= high : v < high)).length;
    const fairCount = finalFairVals.filter(v => v >= low && (idx === 4 ? v <= high : v < high)).length;
    return { bin, count, fairCount };
  });

  const spiralThreshold = 0.85;
  const spiralRuns = finalSycoVals.filter(v => v >= spiralThreshold).length;
  const fairSpiralRuns = finalFairVals.filter(v => v >= spiralThreshold).length;

  const spiralRiskPercentage = Number(((spiralRuns / numSimulations) * 100).toFixed(1));
  const fairSpiralRiskPercentage = Number(((fairSpiralRuns / numSimulations) * 100).toFixed(1));

  const averageFinalConfidence = Number((finalSycoVals.reduce((a, b) => a + b, 0) / numSimulations).toFixed(3));
  const fairAverageFinalConfidence = Number((finalFairVals.reduce((a, b) => a + b, 0) / numSimulations).toFixed(3));

  let summary = '';
  if (botType === 'fair' || sycophancyPi === 0) {
    summary = `Under the Fair baseline (π = 0.00), user beliefs converge towards empirical ground truth (${worldTruth}) in accordance with standard Bayesian convergence theorems. Spiral risk is low (${fairSpiralRiskPercentage}%).`;
  } else if (!trueStateIsH1 && sycophancyPi > 0.4) {
    summary = `With sycophancy π = ${sycophancyPi.toFixed(2)} despite ground truth being H0, the sycophantic chatbot reinforced user confirmation, resulting in ${spiralRiskPercentage}% of simulations spiraling into high false certainty (average final belief: ${(averageFinalConfidence * 100).toFixed(1)}% vs ${(fairAverageFinalConfidence * 100).toFixed(1)}% in fair bot).`;
  } else {
    summary = `Simulated ${numSimulations} conversation trajectories over ${rounds} rounds. Sycophantic response bias elevated belief reinforcement by ${((averageFinalConfidence - fairAverageFinalConfidence) * 100).toFixed(1)} percentage points compared to the fair model.`;
  }

  return {
    config,
    roundsData,
    finalDistribution,
    spiralRiskPercentage,
    fairSpiralRiskPercentage,
    averageFinalConfidence,
    fairAverageFinalConfidence,
    summary
  };
}
