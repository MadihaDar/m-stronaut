import * as THREE from 'three';
import { audio } from './AudioManager.js';
import { storage } from './StorageManager.js';

export const MISSION_DEFINITIONS = {
  moon_m01: {
    id: 'moon_m01',
    destination: 'moon',
    title: 'MISSION 01: FIRST LIGHT',
    subtitle: 'Shackleton Rim Expedition',
    tasks: [
      {
        id: 'drive_to_ridge',
        icon: '🚗',
        title: 'Drive Rover to Shackleton Ridge',
        instruction: 'Board your 6-wheel rover [V] and drive to the LOLA elevation survey beacon on the crater rim!',
        beaconPos: new THREE.Vector3(25, 0, 20),
        interactionDist: 8,
        actionType: 'drive_to',
        kidTerm: 'LOLA',
        kidTip: 'LOLA uses laser beams from orbit to measure the heights of lunar mountains and crater depths!'
      },
      {
        id: 'lend_ice_detector',
        icon: '🧊',
        title: 'Scan for Water Ice with LEND',
        instruction: 'Drive into the permanently shadowed crater floor and press [E] to detect buried hydrogen ice!',
        beaconPos: new THREE.Vector3(28, -3.5, 25),
        interactionDist: 5,
        actionType: 'interact_target',
        kidTerm: 'PSR',
        kidTip: 'PSR means Permanently Shadowed Region — crater spots where sunlight never reaches, keeping ice frozen for billions of years!'
      },
      {
        id: 'activate_solar_tower',
        icon: '⚡',
        title: 'Align Polar Solar Tower',
        instruction: 'Climb to the Peak of Eternal Light and press [E] to align the solar power array toward the horizon sun!',
        beaconPos: new THREE.Vector3(-14, 0, -22),
        interactionDist: 5,
        actionType: 'interact_target',
        kidTerm: 'Peak of Light',
        kidTip: 'At the lunar poles, mountain peaks receive almost permanent sunlight, perfect for solar energy!'
      },
      {
        id: 'eat_energy_pack',
        icon: '🍎',
        title: 'Eat Energy Ration with [C]',
        instruction: 'Press key [C] to consume an astronaut nutrient ration and replenish your stamina and health!',
        beaconPos: null,
        actionType: 'consume_food',
        kidTerm: 'EVA Nutrition',
        kidTip: 'Space walking burns lots of calories! Astronauts eat nutrient-packed snacks to stay energized.'
      },
      {
        id: 'return_to_base',
        icon: '🏠',
        title: 'Return to Lunar Outpost Alpha',
        instruction: 'Drive or walk back to the base camp airlock [E] to secure your ice samples and complete the mission!',
        beaconPos: new THREE.Vector3(-9.5, 0, -12),
        interactionDist: 4,
        actionType: 'enter_airlock',
        kidTerm: 'Lunar Base',
        kidTip: 'The base provides air, water, and warm shelter from the freezing cold of space!'
      }
    ]
  },
  moon_m02: {
    id: 'moon_m02',
    destination: 'moon',
    title: 'MISSION 02: SHADOW WATCH',
    subtitle: 'Thermal Frontier Expedition',
    tasks: [
      {
        id: 'deploy_thermal_sensor',
        icon: '🌡️',
        title: 'Deploy Diviner Radiometer',
        instruction: 'Walk to the beacon in the blazing sunlit plain (+120°C) and press [E] to deploy the Diviner heat sensor!',
        beaconPos: new THREE.Vector3(15, 0, -15),
        interactionDist: 5,
        actionType: 'interact_target',
        kidTerm: 'Diviner',
        kidTip: 'Diviner is a NASA instrument that measures surface temperatures across the Moon from day to night!'
      },
      {
        id: 'collect_rock_samples',
        icon: '🪨',
        title: 'Collect Basalt Rock Samples',
        instruction: 'Drive to the boulder field and press [E] to collect Mare Imbrium volcanic basalt samples with your robotic arm!',
        beaconPos: new THREE.Vector3(-22, 0, 18),
        interactionDist: 6,
        actionType: 'interact_target',
        kidTerm: 'Regolith',
        kidTip: 'Lunar regolith is fine powdery soil and broken rock fragments created by billions of years of meteorite impacts!'
      },
      {
        id: 'cold_trap_survey',
        icon: '❄️',
        title: 'Survey Cold Trap (-180°C)',
        instruction: 'Navigate into the cold trap depression and press [E] to activate equipment radiator heating!',
        beaconPos: new THREE.Vector3(30, -3.8, 10),
        interactionDist: 6,
        actionType: 'interact_target',
        kidTerm: 'Cold Trap',
        kidTip: 'Cold traps are so freezing (-180°C) that any water molecules get trapped there like ice in a freezer!'
      },
      {
        id: 'transmit_data',
        icon: '📡',
        title: 'Transmit Data to Earth',
        instruction: 'Head to the high-gain comms dish at base camp and press [E] to beam the thermal dataset to Earth!',
        beaconPos: new THREE.Vector3(-18, 0, -8),
        interactionDist: 5,
        actionType: 'interact_target',
        kidTerm: 'Telemetry',
        kidTip: 'Telemetry means radio signals sending scientific measurements through deep space to Earth!'
      },
      {
        id: 'debrief_certificate',
        icon: '🏆',
        title: 'Debrief & Commander Certificate',
        instruction: 'Enter the habitat airlock [E] to compile your findings and receive your Science Commander Certificate!',
        beaconPos: new THREE.Vector3(-9.5, 0, -12),
        interactionDist: 4,
        actionType: 'enter_airlock',
        kidTerm: 'Certification',
        kidTip: 'You have mastered real NASA lunar datasets and earned your Junior Mission Commander wings!'
      }
    ]
  },
  mars_m01: {
    id: 'mars_m01',
    destination: 'mars',
    title: 'MISSION M01: LIFE ON MARS',
    subtitle: 'Build a Home on Mars',
    tasks: [
      {
        id: 'sweep_solar_panels',
        icon: '🧹',
        title: 'Sweep Martian Dust off Solar Panels',
        instruction: 'Walk up to the 4 solar panels [E] and sweep off Martian dust to restore 100% power to base life support!',
        beaconPos: new THREE.Vector3(-7, 1.2, -26),
        interactionDist: 5,
        actionType: 'sweep_panels',
        kidTerm: 'Solar Dust',
        kidTip: 'Red Martian dust settles onto solar panels, blocking light and cutting power until astronauts sweep them clean!'
      },
      {
        id: 'activate_water_drill',
        icon: '💧',
        title: 'Activate SWIM Water Ice Drill',
        instruction: 'Go to the water extraction rig [E] and start the subsurface drill to pump fresh water into the tanks!',
        beaconPos: new THREE.Vector3(20, 0, 14),
        interactionDist: 5,
        actionType: 'drill_water',
        kidTerm: 'SWIM Radar',
        kidTip: 'SWIM is a NASA radar map that peeks deep underground to find buried glaciers of pure water ice on Mars!'
      },
      {
        id: 'enter_habitat_interior',
        icon: '🚪',
        title: 'Enter 3D Base Through the Airlock',
        instruction: 'Walk to the airlock door [E] and step inside your futuristic 3D Martian living quarters and greenhouse!',
        beaconPos: new THREE.Vector3(-11, 1.3, -10),
        interactionDist: 4,
        actionType: 'enter_airlock',
        kidTerm: 'Airlock',
        kidTip: 'The airlock equalizes pressure so you can safely enter the warm, pressurized habitat from the freezing Martian vacuum!'
      },
      {
        id: 'harvest_greenhouse_crops',
        icon: '🌱',
        title: 'Harvest Fresh Hydroponic Crops',
        instruction: 'Walk into the 3D Greenhouse inside the base and press [E] to harvest fresh ripe Martian tomatoes!',
        beaconPos: new THREE.Vector3(-16, 0.5, 12),
        interactionDist: 4.5,
        actionType: 'harvest_crops',
        kidTerm: 'Hydroponics',
        kidTip: 'Hydroponics lets us grow delicious, healthy food inside water and nutrient tanks without needing rich soil!'
      },
      {
        id: 'consume_food_c',
        icon: '🍎',
        title: 'Eat Fresh Food with [C]',
        instruction: 'Press key [C] to eat your fresh harvested food, restoring your astronaut health and stamina to 100%!',
        beaconPos: null,
        actionType: 'consume_food',
        kidTerm: 'Nutrition',
        kidTip: 'Eating fresh crops gives your astronaut essential energy and vitamins to stay strong on long missions!'
      },
      {
        id: 'seek_radiation_shelter',
        icon: '☢️',
        title: 'Take Cover in Radiation Shelter',
        instruction: 'Solar flare detected! Walk into the reinforced 3D Radiation Bunker inside the base to protect the crew!',
        beaconPos: new THREE.Vector3(-16, 0.5, -16),
        interactionDist: 4.5,
        actionType: 'shelter_bunker',
        kidTerm: 'MSL RAD',
        kidTip: 'MSL RAD measured space radiation on Mars. Thick walls protect astronauts from high-energy cosmic rays!'
      }
    ]
  },
  mars_m02: {
    id: 'mars_m02',
    destination: 'mars',
    title: 'MISSION M02: THE JOURNEY HOME',
    subtitle: 'Earth Return Flight',
    tasks: [
      {
        id: 'balance_cargo_payload',
        icon: '⚖️',
        title: 'Balance 400 kg Return Cargo',
        instruction: 'Inspect the cargo crane [E] and balance the 400 kg MAV limit between science rock samples and life support spares!',
        beaconPos: new THREE.Vector3(26, 0, -18),
        interactionDist: 5,
        actionType: 'balance_cargo',
        kidTerm: 'Payload Limit',
        kidTip: 'Rockets can only lift a strict maximum weight, so astronauts must balance science samples against safety gear!'
      },
      {
        id: 'inspect_mav_rocket',
        icon: '🚀',
        title: 'Inspect MAV Launch Vehicle',
        instruction: 'Walk up to the two-stage MAV rocket on the launch pad [E] and verify Stage 1 and Stage 2 fuel pressures!',
        beaconPos: new THREE.Vector3(32, 0, -18),
        interactionDist: 6,
        actionType: 'inspect_mav',
        kidTerm: 'MAV Rocket',
        kidTip: 'The Mars Ascent Vehicle (MAV) was delivered before the astronauts arrived, pre-fueled with liquid methane and oxygen!'
      },
      {
        id: 'execute_departure_checklist',
        icon: '📋',
        title: 'Execute 10-Point Pre-Launch Check',
        instruction: 'Open the launch terminal [E] and verify all 10 pre-flight systems: Engines, Oxygen, Trajectory, and Comms!',
        beaconPos: new THREE.Vector3(32, 0, -14),
        interactionDist: 5,
        actionType: 'execute_checklist',
        kidTerm: 'Checklist',
        kidTip: 'Astronauts run rigorous checklists before every flight to guarantee all systems are 100% ready for launch!'
      },
      {
        id: 'board_crew_capsule',
        icon: '🚪',
        title: 'Board Return Crew Capsule',
        instruction: 'Walk onto the launch gantry elevator and climb into the MAV command seats [E]!',
        beaconPos: new THREE.Vector3(32, 4.5, -18),
        interactionDist: 5,
        actionType: 'board_capsule',
        kidTerm: 'Capsule',
        kidTip: 'The crew capsule protects the astronauts during launch and re-entry through Earth atmosphere!'
      },
      {
        id: 'ignite_launch_sequence',
        icon: '🛰️',
        title: 'Initiate Ignition & Return Home!',
        instruction: 'Press the Master Ignition button to fire the rocket engines, reach Mars parking orbit, and return to Earth!',
        beaconPos: new THREE.Vector3(32, 4.5, -18),
        interactionDist: 5,
        actionType: 'launch_mav',
        kidTerm: 'Delta-V',
        kidTip: 'Delta-V is the change in velocity needed to break free from Mars gravity and fly home to planet Earth!'
      }
    ]
  }
};

export class MissionManager {
  constructor(game) {
    this.game = game;
    this.activeMission = null;
    this.currentTaskIndex = 0;
    this.tasksCompleted = 0;
    this.beaconMesh = null;
    this.dustPanelsCleaned = 0;

    this.create3DBeacon();
  }

  create3DBeacon() {
    this.beaconGroup = new THREE.Group();
    this.beaconGroup.visible = false;

    // 1. Vertical light cylinder
    const beamGeo = new THREE.CylinderGeometry(0.35, 0.35, 28, 16, 1, true);
    beamGeo.translate(0, 14, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.beamMesh = new THREE.Mesh(beamGeo, beamMat);
    this.beaconGroup.add(this.beamMesh);

    // 2. Ground pulsing ring
    const ringGeo = new THREE.RingGeometry(1.2, 1.8, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.position.y = 0.1;
    this.beaconGroup.add(this.ringMesh);

    // 3. Floating 3D diamond icon marker
    const markerGeo = new THREE.OctahedronGeometry(0.9, 0);
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8
    });
    this.markerMesh = new THREE.Mesh(markerGeo, markerMat);
    this.markerMesh.position.y = 2.5;
    this.beaconGroup.add(this.markerMesh);

    this.game.scene.add(this.beaconGroup);
  }

  startMission(missionId) {
    const missionDef = MISSION_DEFINITIONS[missionId];
    if (!missionDef) return;

    this.activeMission = missionDef;
    this.currentTaskIndex = 0;
    this.tasksCompleted = 0;
    this.dustPanelsCleaned = 0;

    this.updateBeaconPosition();
    this.notifyHUD();

    audio.playSuccess();
  }

  getCurrentTask() {
    if (!this.activeMission) return null;
    return this.activeMission.tasks[this.currentTaskIndex] || null;
  }

  updateBeaconPosition() {
    const task = this.getCurrentTask();
    if (!task || !task.beaconPos) {
      this.beaconGroup.visible = false;
      return;
    }

    this.beaconGroup.visible = true;
    this.beaconGroup.position.copy(task.beaconPos);

    // Color theme based on planet
    const isMars = this.activeMission.destination === 'mars';
    const color = isMars ? 0xf97316 : 0x38bdf8;
    this.beamMesh.material.color.setHex(color);
    this.ringMesh.material.color.setHex(color);
  }

  update(delta, playerPos) {
    if (!this.activeMission) return;

    // Animate beacon
    if (this.beaconGroup.visible) {
      this.markerMesh.rotation.y += delta * 2.0;
      this.markerMesh.position.y = 2.5 + Math.sin(Date.now() * 0.004) * 0.4;
      const pulse = 1.0 + Math.sin(Date.now() * 0.006) * 0.25;
      this.ringMesh.scale.set(pulse, pulse, pulse);
    }

    const currentTask = this.getCurrentTask();
    if (!currentTask) return;

    // Check distance-based proximity completion for drive_to or beacon arrival
    if (currentTask.actionType === 'drive_to' && currentTask.beaconPos) {
      const dist = playerPos.distanceTo(currentTask.beaconPos);
      if (dist < (currentTask.interactionDist || 7)) {
        this.completeCurrentTask();
      }
    }
  }

  triggerAction(actionType, extraData = {}) {
    if (!this.activeMission) return;
    const currentTask = this.getCurrentTask();
    if (!currentTask) return;

    if (currentTask.actionType === actionType) {
      if (actionType === 'sweep_panels') {
        this.dustPanelsCleaned++;
        if (this.dustPanelsCleaned >= 4) {
          this.completeCurrentTask();
        } else {
          audio.playClick();
          this.game.uiManager.hud.showFloatingNotice(`🧹 Panel ${this.dustPanelsCleaned}/4 Cleaned! (+Power restored)`);
        }
        return;
      }

      this.completeCurrentTask();
    }
  }

  completeCurrentTask() {
    const task = this.getCurrentTask();
    if (!task) return;

    audio.playSuccess();
    this.tasksCompleted++;
    this.game.uiManager.hud.showTaskCelebration(task.title);

    // Award score & experience
    storage.state.scoreBreakdown.science = Math.min(1.0, storage.state.scoreBreakdown.science + 0.12);
    storage.save();

    this.currentTaskIndex++;
    const nextTask = this.getCurrentTask();

    if (nextTask) {
      this.updateBeaconPosition();
      this.notifyHUD();
    } else {
      // Mission Complete!
      this.beaconGroup.visible = false;
      this.onMissionCompleted();
    }
  }

  onMissionCompleted() {
    audio.playFanfare();
    const mission = this.activeMission;

    // Mark completion in storage
    if (mission.id === 'mars_m01') storage.state.marsState.m01Completed = true;
    if (mission.id === 'mars_m02') storage.state.marsState.m02Completed = true;
    storage.save();

    this.notifyHUD();

    setTimeout(() => {
      if (mission.id === 'mars_m02') {
        this.game.uiManager.multipleEndingsModal.showOutcome();
      } else {
        this.game.uiManager.missionDebriefModal.show(mission.id);
      }
    }, 2500);
  }

  notifyHUD() {
    if (this.game.uiManager && this.game.uiManager.hud) {
      this.game.uiManager.hud.updateMissionTracker(this.activeMission, this.getCurrentTask(), this.currentTaskIndex);
    }
  }
}
