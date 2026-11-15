export class ScoringSystem {
  // Part 7.8: Suggested educational scoring weights
  static WEIGHTS = {
    safety: 0.30,
    navigation: 0.20,
    resource: 0.20,
    science: 0.15,
    alert_response: 0.10,
    teamwork: 0.05
  };

  static calculate(factors) {
    const s = Math.max(0, Math.min(1, factors.safety ?? 1.0));
    const nav = Math.max(0, Math.min(1, factors.navigation ?? 0.6));
    const r = Math.max(0, Math.min(1, factors.resource ?? 1.0));
    const sci = Math.max(0, Math.min(1, factors.science ?? 0.4));
    const alert = Math.max(0, Math.min(1, factors.alert_response ?? 0.8));
    const team = Math.max(0, Math.min(1, factors.teamwork ?? 0.85));

    // Hard Gate: Crew safety must be a hard gate. A player must not receive the highest
    // mission outcome if they knowingly compromise crew safety, even if they collect many samples.
    if (s <= 0.10) {
      return {
        totalScore: 0,
        grade: 'MISSION COMPROMISED (CRITICAL SAFETY GATE BREACH)',
        isSafetyFailed: true,
        breakdown: {
          safety: s,
          navigation: nav,
          resource: r,
          science: sci,
          alert_response: alert,
          teamwork: team
        }
      };
    }

    const weightedSum =
      this.WEIGHTS.safety * s +
      this.WEIGHTS.navigation * nav +
      this.WEIGHTS.resource * r +
      this.WEIGHTS.science * sci +
      this.WEIGHTS.alert_response * alert +
      this.WEIGHTS.teamwork * team;

    const totalScore = Math.round(100 * weightedSum);

    let grade = 'CADET TRAINEE';
    if (totalScore >= 90) grade = 'MASTER MISSION COMMANDER';
    else if (totalScore >= 80) grade = 'SENIOR ASTRONAUT';
    else if (totalScore >= 70) grade = 'EXPEDITION SPECIALIST';
    else if (totalScore >= 55) grade = 'JUNIOR FLIGHT OFFICER';

    return {
      totalScore,
      grade,
      isSafetyFailed: false,
      breakdown: {
        safety: Math.round(s * 100),
        navigation: Math.round(nav * 100),
        resource: Math.round(r * 100),
        science: Math.round(sci * 100),
        alert_response: Math.round(alert * 100),
        teamwork: Math.round(team * 100)
      }
    };
  }
}
