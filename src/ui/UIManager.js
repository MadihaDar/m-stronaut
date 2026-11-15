import { MainMenu } from './MainMenu.js';
import { DestinationSelector } from './DestinationSelector.js';
import { CharacterDossier } from './CharacterDossier.js';
import { ScienceDatabase } from './ScienceDatabase.js';
import { SettingsModal } from './SettingsModal.js';
import { HUD } from './HUD.js';
import { ScannerPanel } from './ScannerPanel.js';
import { DialogueBox } from './DialogueBox.js';
import { ScienceMapViewer } from './ScienceMapViewer.js';
import { RoverRoutePlanner } from './RoverRoutePlanner.js';
import { MissionAlertModal } from './MissionAlertModal.js';
import { MissionBriefingModal } from './MissionBriefingModal.js';
import { MissionDebriefModal } from './MissionDebriefModal.js';
import { DatasetInfoModal } from './DatasetInfoModal.js';
import { CampaignMapModal } from './CampaignMapModal.js';

// Mars Dedicated Systems
import { HabitatPanel } from './mars/HabitatPanel.js';
import { GreenhouseInterface } from './mars/GreenhouseInterface.js';
import { WaterInvestigationInterface } from './mars/WaterInvestigationInterface.js';
import { RadiationSafetyInterface } from './mars/RadiationSafetyInterface.js';
import { EnvironmentalStation } from './mars/EnvironmentalStation.js';
import { CargoDecisionInterface } from './mars/CargoDecisionInterface.js';
import { DepartureChecklistInterface } from './mars/DepartureChecklistInterface.js';
import { MultipleEndingsModal } from './mars/MultipleEndingsModal.js';

import { storage } from '../engine/StorageManager.js';
import { DESTINATIONS } from '../data/destinations.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('ui-root');

    // UI instances
    this.mainMenu = new MainMenu(this);
    this.destinationSelector = new DestinationSelector(this);
    this.characterDossier = new CharacterDossier(this);
    this.scienceDatabase = new ScienceDatabase(this);
    this.settingsModal = new SettingsModal(this);
    this.hud = new HUD(this);
    this.scannerPanel = new ScannerPanel(this);
    this.dialogueBox = new DialogueBox(this);
    this.scienceMapViewer = new ScienceMapViewer(this);
    this.roverRoutePlanner = new RoverRoutePlanner(this);
    this.missionAlertModal = new MissionAlertModal(this);
    this.missionBriefingModal = new MissionBriefingModal(this);
    this.missionDebriefModal = new MissionDebriefModal(this);
    this.datasetInfoModal = new DatasetInfoModal(this);
    this.campaignMapModal = new CampaignMapModal(this);

    // Mars Interfaces
    this.habitatPanel = new HabitatPanel(this);
    this.greenhouseInterface = new GreenhouseInterface(this);
    this.waterInvestigationInterface = new WaterInvestigationInterface(this);
    this.radiationSafetyInterface = new RadiationSafetyInterface(this);
    this.environmentalStation = new EnvironmentalStation(this);
    this.cargoDecisionInterface = new CargoDecisionInterface(this);
    this.departureChecklistInterface = new DepartureChecklistInterface(this);
    this.multipleEndingsModal = new MultipleEndingsModal(this);

    this.init();
  }

  init() {
    this.root.appendChild(this.mainMenu.element);
    this.root.appendChild(this.destinationSelector.element);
    this.root.appendChild(this.characterDossier.element);
    this.root.appendChild(this.scienceDatabase.element);
    this.root.appendChild(this.settingsModal.element);
    this.root.appendChild(this.hud.element);
    this.root.appendChild(this.scannerPanel.element);
    this.root.appendChild(this.dialogueBox.element);
    this.root.appendChild(this.scienceMapViewer.element);
    this.root.appendChild(this.roverRoutePlanner.element);
    this.root.appendChild(this.missionAlertModal.element);
    this.root.appendChild(this.missionBriefingModal.element);
    this.root.appendChild(this.missionDebriefModal.element);
    this.root.appendChild(this.datasetInfoModal.element);
    this.root.appendChild(this.campaignMapModal.element);

    // Append Mars Modals
    this.root.appendChild(this.habitatPanel.element);
    this.root.appendChild(this.greenhouseInterface.element);
    this.root.appendChild(this.waterInvestigationInterface.element);
    this.root.appendChild(this.radiationSafetyInterface.element);
    this.root.appendChild(this.environmentalStation.element);
    this.root.appendChild(this.cargoDecisionInterface.element);
    this.root.appendChild(this.departureChecklistInterface.element);
    this.root.appendChild(this.multipleEndingsModal.element);

    // Initial destination label in HUD
    const curDest = DESTINATIONS[storage.state.selectedDestination || 'mars'];
    this.hud.setDestinationName(curDest.name);

    // Apply color blind mode
    this.applyColorBlindMode(storage.getSetting('colorBlindMode'));

    // Apply font size
    if (storage.getSetting('fontSize') === 'large') {
      document.body.classList.add('large-text');
    }
  }

  startMission(missionId = 'moon_m01') {
    if (missionId && missionId.startsWith('moon')) {
      this.startMoonMission(missionId);
    } else {
      this.startMarsMission(missionId === 'mars_m02' ? 'M02' : 'M01');
    }
  }

  startMoonMission(missionCode = 'moon_m01') {
    this.mainMenu.hide();
    this.hud.show();
    this.game.switchDestination('moon');
    const destName = missionCode === 'moon_m01' ? 'MOON (SHACKLETON CRATER RIM)' : 'MOON (MARE IMBRIUM THERMAL)';
    this.hud.setDestinationName(destName);
    this.game.setInMission(true);
    if (this.game.missionManager) {
      this.game.missionManager.startMission(missionCode);
    }

    if (missionCode === 'moon_m01') {
      this.dialogueBox.showDialogue({
        characterId: 'orbit',
        message: 'Welcome to the Lunar South Pole, Junior Commander! We are stationed on Shackleton Crater Rim (89.9°S). Our mission is to explore permanently shadowed regions and search for water ice volatiles using LOLA elevation and LEND neutron data.'
      });
      this.dialogueBox.showDialogue({
        characterId: 'alex',
        message: 'Commander, suit up and inspect the rover. The sun sits permanently on the horizon here, casting deep shadows across the crater interior.'
      });
      this.dialogueBox.showDialogue({
        characterId: 'maya',
        message: 'I am calibrating our LEND neutron spectrometer. Look for hydrogen anomalies in the shadowed floor below!'
      });
    } else {
      this.dialogueBox.showDialogue({
        characterId: 'orbit',
        message: 'Welcome to Mission 02: Shadow Watch! We have deployed to Mare Imbrium to study extreme thermal variations with NASA Diviner GCP radiometer data.'
      });
      this.dialogueBox.showDialogue({
        characterId: 'alex',
        message: 'Temperatures swing wildly from +120°C in full sunlight down to -180°C in cold traps. Monitor our thermal radiator panels closely.'
      });
      this.dialogueBox.showDialogue({
        characterId: 'chen',
        message: 'Check rock abundance readings and survey regolith heat retention as we navigate the basaltic plains.'
      });
    }
  }

  startMarsMission(missionCode = 'M01') {
    this.mainMenu.hide();
    this.hud.show();
    this.game.switchDestination('mars');
    this.hud.setDestinationName('MARS (JEZERO OUTPOST)');
    this.game.setInMission(true);
    if (this.game.missionManager) {
      this.game.missionManager.startMission(missionCode === 'M02' ? 'mars_m02' : 'mars_m01');
    }

    if (missionCode === 'M01') {
      // 3.1 Opening cinematic narrative
      this.dialogueBox.showDialogue({
        characterId: 'orbit',
        message: 'Welcome to Mars, Junior Commander! This is our new home for the next part of the mission. Mars is beautiful, but it is not an easy place to live. We need power, water, oxygen, food and a safe place to shelter. Your decisions will help the crew complete its mission and return home.'
      });

      this.dialogueBox.showDialogue({
        characterId: 'alex',
        message: 'Commander, our first job is simple: make sure everyone and everything is safe. Inspect our solar panels, activate the life-support loops, and then we can begin exploring.'
      });

      this.dialogueBox.showDialogue({
        characterId: 'leo',
        message: 'The 6-wheel rover is fully charged in the garage bay. Hop in by pressing [V] or walk up to any base facility and press [E] to inspect!'
      });
    } else {
      // Mission M02: Return mission loading saved M01 state
      const m1State = storage.state.marsState;
      this.dialogueBox.showDialogue({
        characterId: 'alex',
        message: `Welcome back, Commander! Mission M01 state loaded: Oxygen at ${m1State.oxygen}%, Water at ${m1State.water}%, Power at ${m1State.power}%. The return window is approaching. Our final mission is to bring everyone back safely!`
      });

      this.dialogueBox.showDialogue({
        characterId: 'orbit',
        message: 'Notice: Return payload capacity is capped at 400 kg. Press the [CARGO] or [CHECKLIST] tool to balance your sample cache against backup life-support spares!'
      });
    }
  }

  openMainMenu() {
    this.hud.hide();
    this.mainMenu.show();
    this.game.setInMission(false);
  }

  openModal(name) {
    if (name === 'destinations') this.campaignMapModal.show('mars');
    if (name === 'crew') this.characterDossier.show();
    if (name === 'science') this.scienceDatabase.show();
    if (name === 'settings') this.settingsModal.show();
  }

  onDestinationChanged(destId) {
    const dest = DESTINATIONS[destId];
    this.hud.setDestinationName(dest.name);
    this.game.switchDestination(destId);
  }

  onCharacterChanged(charId) {
    this.game.switchCharacter(charId);
  }

  applyColorBlindMode(mode) {
    document.body.classList.remove('cb-deuteranopia', 'cb-protanopia', 'cb-high-contrast');
    if (mode === 'deuteranopia') document.body.classList.add('cb-deuteranopia');
    if (mode === 'protanopia') document.body.classList.add('cb-protanopia');
    if (mode === 'high_contrast') document.body.classList.add('cb-high-contrast');
  }

  update(delta) {
    this.hud.update(delta);
  }
}
