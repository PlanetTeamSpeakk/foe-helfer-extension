/*
 * **************************************************************************************
 *
 * Dateiname:                 ant.js
 * Projekt:                   foe
 *
 * erstellt von:              Daniel Siekiera <daniel.siekiera@gmail.com>
 * zu letzt bearbeitet:       17.11.19, 13:48 Uhr
 *
 * Copyright © 2019
 *
 * **************************************************************************************
 */

let ApiURL = 'https://api.foe-rechner.de/',
    ActiveMap = 'main',
    ExtPlayerID = 0,
    ExtGuildID = 0,
    ExtWorld = '',
    CurrentEra = null,
    BuildingNamesi18n = false,
    CityMapData = null,
    Conversations = [],
    GoodsNames = [],
    GoodsList = [],
    ResourceStock = [],
    MainMenuLoaded = false;
  
document.addEventListener("DOMContentLoaded", function(){

	// aktuelle Welt notieren
	ExtWorld = window.location.hostname.split('.')[0];
	localStorage.setItem('current_world', ExtWorld);

	// Local-Storage leeren
	localStorage.removeItem('OwnCurrentBuildingCity');
    localStorage.removeItem('OwnCurrentBuildingGreat');

	MainParser.setLanguage();
});


(function () {
    let LastKostenrechnerOpenTime = 0;

	let XHR = XMLHttpRequest.prototype,
		open = XHR.open,
		send = XHR.send;

	XHR.open = function(method, url){
		this._method = method;
		this._url = url;
		return open.apply(this, arguments);
	};

	XHR.send = function(postData){

		this.addEventListener('load', function()
		{

			// die Gebäudenamen übernehmen
			if(this._url.indexOf("metadata?id=city_entities") > -1 && BuildingNamesi18n === false)
			{
				BuildingNamesi18n = [];

				MainParser.loadJSON(this._url, function(r)
				{
					let j = JSON.parse(r);

					sessionStorage.setItem('BuildingsData', JSON.stringify(j));

					for (let i in j)
					{
						if (j.hasOwnProperty(i))
						{
							BuildingNamesi18n[j[i]['asset_id']] = {
								name: j[i]['name'],
								width: j[i]['width'],
								height: j[i]['length'],
								type: j[i]['type'],
							};

							if(j[i]['abilities'] !== undefined)
							{
								for(let x in j[i]['abilities'])
								{
									if (j[i]['abilities'].hasOwnProperty(x))
									{
										let ar = j[i]['abilities'][x];

										if(ar['additionalResources'] !== undefined && ar['additionalResources']['AllAge'] !== undefined && ar['additionalResources']['AllAge']['resources'] !== undefined)
										{
											BuildingNamesi18n[j[i]['asset_id']]['additionalResources'] = ar['additionalResources']['AllAge']['resources'];
										}
									}
								}
							}
						}
					}
				});
			}

            if (this._url.indexOf("metadata?id=research") > -1) {
                Technologies.AllTechnologies = JSON.parse(this.responseText);
                $('#Tech').removeClass('hud-btn-red');
            }

			// nur die jSON mit den Daten abfangen
			if(this._url.indexOf("game/json?h=") > -1)
			{

				let d = JSON.parse(this.responseText);

				// --------------------------------------------------------------------------------------------------
				// Player- und Gilden-ID setzen
				let StartupService = d.find(obj => (obj['requestClass'] === 'StartupService' && obj['requestMethod'] === 'getData'));

				if(StartupService !== undefined){

					// Player-ID, Gilden-ID und Name setzten
					MainParser.StartUp(StartupService['responseData']['user_data']);

					// andere Gildenmitglieder, Nachbarn und Freunde
					MainParser.SocialbarList(StartupService['responseData']['socialbar_list']);

					// eigene Daten, Maximal alle 6h updaten
					MainParser.SelfPlayer(StartupService['responseData']['user_data']);

					// Alle Gebäude sichern
                    MainParser.SaveBuildings(StartupService['responseData']['city_map']['entities']);

                    GoodsList = StartupService['responseData']['goodsList'];
				}

				// --------------------------------------------------------------------------------------------------
				// Boosts zusammen tragen
				let BoostService = d.find(obj => {
					return obj['requestClass'] === 'BoostService' && obj['requestMethod'] === 'getAllBoosts';
				});

				if(BoostService !== undefined){
					MainParser.CollectBoosts(BoostService['responseData']);
				}

				// --------------------------------------------------------------------------------------------------
				// Karte wird gewechselt zum Außenposten
				let GridService = d.find(obj => {
					return obj['requestClass'] === 'CityMapService' && obj['requestMethod'] === 'getCityMap';
				});

				if(GridService !== undefined){
					ActiveMap = GridService['responseData']['gridId'];
				}


				// Stadt wird wieder aufgerufen
				let CityMapService = d.find(obj => {
					return obj['requestClass'] === 'CityMapService' && obj['requestMethod'] === 'getEntities';
				});

				if(CityMapService !== undefined && ActiveMap === 'cultural_outpost'){
					ActiveMap = 'main';
				}


				// --------------------------------------------------------------------------------------------------
				// --------------------------------------------------------------------------------------------------
				// Chat-Titel notieren
				let ConversationService = d.find(obj => {
					return (obj['requestClass'] === 'ConversationService' && obj['requestMethod'] === 'getOverview') || (obj['requestClass'] === 'ConversationService' && obj['requestMethod'] === 'getTeasers');
				});

				if(ConversationService !== undefined){
					MainParser.setConversations(ConversationService['responseData']);
				}


				// --------------------------------------------------------------------------------------------------
				// Übersetzungen der Güter
				let GoodsService = d.find(obj => {
					return obj['requestClass'] === 'ResourceService' && obj['requestMethod'] === 'getResourceDefinitions';
				});

				if(GoodsService !== undefined){
					MainParser.setGoodsNames(GoodsService['responseData']);
				}

				// --------------------------------------------------------------------------------------------------
				// LG Inventory

				let LGInventory = d.find(obj => {
					return obj['requestClass'] === 'InventoryService' && obj['requestMethod'] === 'getGreatBuildings'
				});

				if(LGInventory !== undefined && Settings.GetSetting('GlobalSend')){
					MainParser.SaveLGInventory(LGInventory['responseData']);
				}


				// --------------------------------------------------------------------------------------------------
				// Noch Verfügbare FP aktualisieren

				let FPOverview = d.find(obj => {
					return obj['requestClass'] === 'GreatBuildingsService' && obj['requestMethod'] === 'getAvailablePackageForgePoints'
				});

				if(FPOverview !== undefined){
					StrategyPoints.ForgePointBar(FPOverview['responseData'][0]);
				}


				let GreatBuildingsFPs = d.find(obj => {
					return obj['requestClass'] === 'GreatBuildingsService' && obj['requestMethod'] === 'getConstruction'
				});

				if(GreatBuildingsFPs !== undefined){
					StrategyPoints.ForgePointBar(GreatBuildingsFPs['responseData']['availablePackagesForgePointSum']);
				}


				let FPFromInventory = d.find(obj => {
					return obj['requestClass'] === 'InventoryService' && obj['requestMethod'] === 'getItems'
				});

				if(FPFromInventory !== undefined){
					StrategyPoints.GetFromInventory(FPFromInventory['responseData']);
				}

				let FPGetFromInventory = d.find(obj => {
					return obj['requestClass'] === 'InventoryService' && obj['requestMethod'] === 'getInventory'
				});

				if(FPGetFromInventory !== undefined){
					StrategyPoints.GetFromInventory(FPGetFromInventory['responseData']['inventoryItems']);
				}

				// --------------------------------------------------------------------------------------------------
				// --------------------------------------------------------------------------------------------------
				// Es wurde das LG eines Mitspielers angeklickt, bzw davor die Übersicht

				// Übersicht der LGs eines Nachbarn
				let GreatBuildingsServiceOverview = d.find(obj => {
					return obj['requestClass'] === 'GreatBuildingsService' && obj['requestMethod'] === 'getOtherPlayerOverview';
				});

				if(GreatBuildingsServiceOverview !== undefined && GreatBuildingsServiceOverview['responseData'][0]['player']['player_id'] !== ExtPlayerID && Settings.GetSetting('PreScanLGList')){
                    sessionStorage.setItem('OtherActiveBuildingOverview', JSON.stringify(GreatBuildingsServiceOverview['responseData']));
                    sessionStorage.setItem('DetailViewIsNewer', false);

					$('#calcFPs').removeClass('hud-btn-red');
					$('#calcFPs-closed').remove();

					// wenn schon offen, den Inhalt updaten
					if ($('#LGOverviewBox').is(':visible'))
                    {
                        let CurrentTime = new Date().getTime()
                        if (CurrentTime < LastKostenrechnerOpenTime + 1000)
                            Calculator.ShowOverview(true);
                        else
                            Calculator.ShowOverview(false);
					}
				}
                
				// es wird ein LG eines Spielers geöffnet
                let getConstruction = d.find(obj => {
                    return obj['requestClass'] === 'GreatBuildingsService' && obj['requestMethod'] === 'getConstruction';
                });

                let contributeForgePoints = d.find(obj => {
                    return obj['requestClass'] === 'GreatBuildingsService' && obj['requestMethod'] === 'contributeForgePoints';
                });

                let Rankings;
                if (getConstruction !== undefined) {
                    Rankings = getConstruction['responseData']['rankings'];
                }
                else if (contributeForgePoints !== undefined) {
                    Rankings = contributeForgePoints['responseData'];
                }
                
				let UpdateEntity = d.find(obj => {
					return obj['requestClass'] === 'CityMapService' && obj['requestMethod'] === 'updateEntity';
				});

                if (UpdateEntity !== undefined && Rankings !== undefined) {
                    //Eigenes LG
                    if (UpdateEntity['responseData'][0]['player_id'] === ExtPlayerID) {
                         MainParser.OwnLG(UpdateEntity['responseData'][0], Rankings);
                    }

                    //Fremdes LG
                    if (UpdateEntity['responseData'][0]['player_id'] !== ExtPlayerID) {
                        LastKostenrechnerOpenTime = new Date().getTime()

                        $('#calcFPs').removeClass('hud-btn-red');
                        $('#calcFPs-closed').remove();

                        sessionStorage.setItem('OtherActiveBuilding', JSON.stringify(Rankings));
                        sessionStorage.setItem('OtherActiveBuildingData', JSON.stringify(UpdateEntity['responseData'][0]));
                        sessionStorage.setItem('DetailViewIsNewer', true);

                        // wenn schon offen, den Inhalt updaten
                        if ($('#costCalculator').is(':visible')) {
                            Calculator.Show(Rankings, UpdateEntity['responseData'][0]);
                        }
                    }

				}

				// --------------------------------------------------------------------------------------------------
				// Tavernenboost wurde gekauft
				let TavernBoostService = d.find(obj => {
					return obj['requestClass'] === 'BoostService' && obj['requestMethod'] === 'addBoost';
				});

				if(TavernBoostService !== undefined && Settings.GetSetting('ShowTavernBadge')) {
                    Tavern.TavernBoost(TavernBoostService['responseData']);
                }

				// --------------------------------------------------------------------------------------------------

				let OtherPlayersGild = d.find(obj => {
					return obj['requestClass'] === 'OtherPlayerService' && obj['requestMethod'] === 'getClanMemberList'
				});

				if(OtherPlayersGild !== undefined && Settings.GetSetting('GlobalSend')){
					MainParser.SocialbarList(OtherPlayersGild['responseData']);
				}

				// --------------------------------------------------------------------------------------------------
				// --------------------------------------------------------------------------------------------------

				let OtherPlayersVisits = d.find(obj => {
					return obj['requestClass'] === 'OtherPlayerService' && obj['requestMethod'] === 'visitPlayer'
				});

				// Ernten anderer Spieler
				if(OtherPlayersVisits !== undefined && OtherPlayersVisits['responseData']['other_player']['clan_id'] !== ExtGuildID && OtherPlayersVisits['responseData']['other_player']['clan_id'] !== 7965 && Settings.GetSetting('ShowNeighborsGoods')){
					Reader.OtherPlayersBuildings(OtherPlayersVisits['responseData']);
				}

				// LGs des eigenen Clans auslesen
				if(OtherPlayersVisits !== undefined && OtherPlayersVisits['responseData']['other_player']['clan_id'] === ExtGuildID && Settings.GetSetting('GlobalSend') && Settings.GetSetting('SendGildMemberLGInfo')){
					MainParser.OtherPlayersLGs(OtherPlayersVisits['responseData']);
				}


				// --------------------------------------------------------------------------------------------------
				// Gildenmitglieder in der GEX (Fortschritt, Plazierung usw.)

				let GEXList = d.find(obj => {
					return obj['requestClass'] === 'GuildExpeditionService' && obj['requestMethod'] === 'getContributionList'
				});

				if(GEXList !== undefined && MainParser.checkNextUpdate('GuildExpedition') === true && Settings.GetSetting('GlobalSend')  && Settings.GetSetting('SendGEXInfo')){
					MainParser.GuildExpedition(GEXList['responseData']);
				}


				// --------------------------------------------------------------------------------------------------
				// Gildenplatzierung in der GEX

				let GEXGuild = d.find(obj => {
					return obj['requestClass'] === 'ChampionshipService' && obj['requestMethod'] === 'getOverview'
				});

				if(GEXGuild !== undefined && MainParser.checkNextUpdate('Championship') === true && Settings.GetSetting('GlobalSend') && Settings.GetSetting('SendGEXInfo')){
					MainParser.Championship(GEXGuild['responseData']);
				}


				// --------------------------------------------------------------------------------------------------
				// soll der Außenposten dargestellt werden?
				if(Settings.GetSetting('ShowOutpost'))
				{
					// Alle Typen der Außenposten "notieren"
					let OutpostGetAll = d.find(obj => (obj['requestClass'] === 'OutpostService' && obj['requestMethod'] === 'getAll'));


					if(OutpostGetAll !== undefined){
						Outposts.GetAll(OutpostGetAll['responseData']);
					}

					// Gebäude des Außenpostens sichern
					let OutpostService = d.find(obj => (obj['requestClass'] === 'AdvancementService' && obj['requestMethod'] === 'getAll'));

					if(OutpostService !== undefined){
                        Outposts.SaveBuildings(OutpostService['responseData']);
					}

					// Güter des Spielers ermitteln
					let ResourceService = d.find(obj => (obj['requestClass'] === 'ResourceService' && obj['requestMethod'] === 'getPlayerResources'));

                    if (ResourceService !== undefined) {
                        ResourceStock = ResourceService['responseData']['resources'];
                        Outposts.CollectResources();
					}
				}


				// --------------------------------------------------------------------------------------------------
				// LG Investitionen

				let LGInvests = d.find(obj => {
					return obj['requestClass'] === 'GreatBuildingsService' && obj['requestMethod'] === 'getContributions'
				});

				if(LGInvests !== undefined && MainParser.checkNextUpdate('GreatBuildings') === true && Settings.GetSetting('GlobalSend') && Settings.GetSetting('SendInvestigations')){
					MainParser.GreatBuildings(LGInvests['responseData']);
				}


				// --------------------------------------------------------------------------------------------------
				// LG Freundesliste

				let Friends = d.find(obj => {
					return obj['requestClass'] === 'OtherPlayerService' && obj['requestMethod'] === 'getFriendsList'
				});

				if(Friends !== undefined && MainParser.checkNextUpdate('FriendsList') === true && Settings.GetSetting('GlobalSend')){
					MainParser.FriendsList(Friends['responseData']);
				}


				// --------------------------------------------------------------------------------------------------
				// Moppel Aktivitäten

				let Motivations = d.find(obj => {
					return obj['requestClass'] === 'OtherPlayerService' && obj['requestMethod'] === 'getEventsPaginated'
				});

				if(Motivations !== undefined && Settings.GetSetting('GlobalSend') && Settings.GetSetting('SendTavernInfo')){
					let page = Motivations['responseData']['page'],
						time = MainParser.checkNextUpdate('OtherPlayersMotivation-' + page);

					if(time === true){
						MainParser.OtherPlayersMotivation(Motivations['responseData']);
					}
				}


				let Time = d.find(obj => {
					return obj['requestClass'] === 'TimeService' && obj['requestMethod'] === 'updateTime';
				});

				// erste Runde
				if(MainMenuLoaded === false){
					MainMenuLoaded = Time['responseData']['time'];
				}
				// zweite Runde
				else if (MainMenuLoaded !== false && MainMenuLoaded !== true){
					Menu.BuildOverlayMenu();
					MainMenuLoaded = true;
                }

                // --------------------------------------------------------------------------------------------------
				// Technologien

                let ResearchService = d.find(obj => {
                    return obj['requestClass'] === 'ResearchService' && obj['requestMethod'] === 'getProgress';
                });

                if (ResearchService !== undefined) {
                    Technologies.UnlockedTechologies = ResearchService['responseData'];
                }
			}
		});

		return send.apply(this, arguments);
	};
})();


/**
 *
 * @type {
 * 	{
 * 		SelfPlayer: MainParser.SelfPlayer,
 * 		showInfo: MainParser.showInfo,
 * 		GuildExpedition: MainParser.GuildExpedition,
 * 		FriendsList: MainParser.FriendsList,
 * 		GreatBuildings: MainParser.GreatBuildings,
 * 		SaveBuildings: MainParser.SaveBuildings,
 * 		getAddedDateTime: (function(*=, *=): number),
 * 		getCurrentDateTime: (function(): number),
 * 		checkNextUpdate: (function(*=): (*|boolean|*)),
 * 		OwnLG: MainParser.OwnLG,
 * 		loadJSON: MainParser.loadJSON,
 * 		SocialbarList: MainParser.SocialbarList,
 * 		Championship: MainParser.Championship,
 * 		send2Server: MainParser.send2Server,
 * 		OtherPlayersMotivation: MainParser.OtherPlayersMotivation,
 * 		compareTime: MainParser.compareTime,
 * 		StartUp: MainParser.StartUp,
 * 		OtherPlayersLGs: MainParser.OtherPlayersLGs
 * 	}
 *}
 */
let MainParser = {

	Language: 'en',

	BoostMapper: {
		'supplies_boost': 'supply_production',
		'happiness' : 'happiness_amount',
		'military_boost' : 'att_boost_attacker',
		'money_boost' : 'coin_production'
	},

	
	/**
	 * Speichert alle aktiven Boosts
	 */
	AllBoosts: {
		'def_boost_defender': 0,
		'happiness_amount': 0,
		'att_boost_attacker': 0,
		'coin_production': 0,
		'supply_production': 0
	},

	
	/**
	 *
	 */
	setLanguage: ()=>{
		// Translation
		MainParser.Language = GuiLng;
	},


	/**
	 * Rechnet auf die aktuelle Zeit x Minuten oder x Stunden drauf
	 *
	 * @param hrs
	 * @param min
	 * @returns {number}
	 */
	getAddedDateTime: (hrs, min)=> {

		let time = new Date().getTime(),
			h = hrs || 0,
			m = min || 0,

			// Zeit aufschlagen
			newTime = time + (1000*60*m) + (1000*60*60*h),

			// daraus neues Datumsobjekt erzeugen
			newDate = new Date(newTime);

		return newDate.getTime();
	},


	/**
	 * Gibt die aktuelle Datumszeit zurück
	 *
	 * @returns {number}
	 */
	getCurrentDateTime: ()=> {
		return new Date().getTime();
	},


	/**
	 * Der Storage hat immer schon einen Zeitaufschlag
	 *
	 * @param actual
	 * @param storage
	 * @returns {string|boolean}
	 */
	compareTime: (actual, storage)=> {

		// es gibt noch keinen Eintrag
		if(storage === null){
			return true;

		} else if(actual > storage){
			return true;

			// Zeit Differenz berechnen
		} else if(storage > actual){

			let diff = Math.abs(actual - storage),
				timeDiff = new Date(diff);

			let hh = Math.floor(timeDiff / 1000 / 60 / 60);
			if(hh < 10) {
				hh = '0' + hh;
			}
			timeDiff -= hh * 1000 * 60 * 60;

			let mm = Math.floor(timeDiff / 1000 / 60);
			if(mm < 10) {
				mm = '0' + mm;
			}
			timeDiff -= mm * 1000 * 60;

			let ss = Math.floor(timeDiff / 1000);
			if(ss < 10) {
				ss = '0' + ss;
			}

			return mm + "min und " + ss + 's';
		}
	},


	/**
	 * prüfen ob ein Update notwendig ist
	 *
	 * @param ep
	 * @returns {*}
	 */
	checkNextUpdate: (ep)=> {
		let s = localStorage.getItem(ep),
			a = MainParser.getCurrentDateTime();

		return MainParser.compareTime(a, s);
	},


	/**
	 * Daten nach "Hause" schicken
	 *
	 * @param data
	 * @param ep
	 * @param successCallback
	 */
	send2Server: (data, ep, successCallback)=> {

		let pID = ExtPlayerID,
			cW = ExtWorld,
			gID = ExtGuildID;

		if(cW === '' || cW === null || cW === undefined)
		{
			return ;
		}

		$.ajax({
			type: 'POST',
			url: 'https://foe-rechner.de/import/_ajax?ajax=raw&action=' + ep + '&player_id=' + pID + '&guild_id=' + gID + '&world=' + cW,
			data: {data},
			dataType: 'json',
			success: function(r){
				if(successCallback !== undefined)
				{
					successCallback(r);
				}
			}
		});
	},


	/**
	 * Daten an foe-rechner schicken, wenn aktiviert
	 *
	 * @param data
	 * @param ep
	 * @param successCallback
	 */
	apiCall: (data, ep, successCallback)=> {

		let pID = ExtPlayerID,
			cW = ExtWorld,
			gID = ExtGuildID;

		if(cW === '' || cW === null || cW === undefined)
		{
			return ;
		}

		$.ajax({
			type: 'POST',
			url: ApiURL + ep + '/?player_id=' + pID + '&guild_id=' + gID + '&world=' + cW,
			data: {data},
			dataType: 'json',
			success: function(r){
				if(successCallback !== undefined)
				{
					successCallback(r);
				}
			}
		});
	},


	/**
	 * Benachrichtigung zeigen
	 *
	 * @param title
	 * @param msg
	 * @param time
	 */
	showInfo: (title, msg, time)=> {
		let t = time === undefined ? 4000 : time;

		chrome.runtime.sendMessage(extID, {type: 'message', title: title, msg: msg, time: t});
	},


	/**
	 * Gildenmitglieder durchsteppen
	 *
	 * @param d
	 * @constructor
	 */
	SocialbarList: (d)=> {

		if(Settings.GetSetting('GlobalSend') === false)
		{
			return ;
		}

		if(MainParser.checkNextUpdate('OtherPlayers') === true)
		{
			let player = [];

			for(let k in d){
				if(d.hasOwnProperty(k)){

					// wenn die Gilden-ID eine andere ist, abbrechen
					if(ExtGuildID !== d[k]['clan_id']){
						break;
					}

					let info = {
						avatar: d[k]['avatar'],
						city_name: d[k]['city_name'],
						clan_id: d[k]['clan_id'],
						name: d[k]['name'],
						player_id: d[k]['player_id'],
						rank: d[k]['rank'],
						title: d[k]['title'],
						won_battles: d[k]['won_battles'],
						score: d[k]['score'],
						profile_text: d[k]['profile_text'],
					};

					player.push(info);
				}
			}

			// wenn es nicht leer ist, abschicken
			if(player.length > 0){
				chrome.runtime.sendMessage(extID, {
					type: 'send2Api',
					url: ApiURL + 'OtherPlayers/?player_id=' + ExtGuildID + '&guild_id=' + ExtPlayerID + '&world=' + ExtWorld,
					data: JSON.stringify(player)
				});
			}
		}
	},


	/**
	 * Eigenes LGs updaten
	 * Zeitfenster - 15min
	 *
	 * @param d
	 * @param e
	 * @returns {boolean}
	 * @constructor
	 */
	OwnLG: (d, e)=> {

		localStorage.setItem('OwnCurrentBuildingCity', JSON.stringify(d));
		localStorage.setItem('OwnCurrentBuildingGreat', JSON.stringify(e));

		// das erste LG wurde geladen
		$('#ownFPs').removeClass('hud-btn-red');
		$('#ownFPs-closed').remove();

		if( $('#OwnPartBox').length > 0 ){
			Parts.RefreshData(d, e);
		}

		// ist es schon wieder so weit?
		let lg_name = 'LG-'+ d['cityentity_id'] +'-' + ExtPlayerID,
			time = MainParser.checkNextUpdate(lg_name);

		// noch nicht wieder updaten oder es ist kein "eigenes" LG
		if(time !== true || d['player_id'] !== ExtPlayerID){
			return false;
		}

		MainParser.send2Server(d, 'OwnLG', function(r){

			// nach Erfolg, Zeitstempel in den LocalStorage
			if(r['status'] === 'OK'){
				localStorage.setItem(lg_name, MainParser.getAddedDateTime(0, 15));
			}
		});
	},


	/**
	 * LGs anderer Spieler updaten, aber nur Gilden eigenen
	 *
	 * @param d
	 * @returns {boolean}
	 * @constructor
	 */
	OtherPlayersLGs: (d)=> {

		// ist es schon wieder so weit?
		let time = MainParser.checkNextUpdate('LG-' + d['other_player']['player_id']);
		if(time !== true){
			MainParser.showInfo('Hinweis', 'Bis zum nächsten Übermitteln musst du noch '+ time +' warten');

			return false;
		}

		// gehört nicht zur Gilde
		if(ExtGuildID !== d['other_player']['clan_id']){
			return false;
		}
		let lg = d['city_map']['entities'],
			data = [],
			player = {
				player_id: d['other_player']['player_id'],
				name: d['other_player']['name'],
				guild_id: d['other_player']['clan_id'],
			},
			lgs = [];

		data.push(player);

		for(let k in lg){

			// nur wenn es eines dieser Gebäude ist
			if(lg[k]['cityentity_id'].indexOf("_Landmark") > -1 ||
				lg[k]['cityentity_id'].indexOf("X_AllAge_Expedition") > -1 ||
				lg[k]['cityentity_id'].indexOf("X_AllAge_EasterBonus4") > -1 ||
				lg[k]['cityentity_id'].indexOf("X_AllAge_Oracle") > -1
			){
				let lgd = {

					cityentity_id: lg[k]['cityentity_id'],
					level: lg[k]['level'],
					max_level: lg[k]['max_level'],
					invested_forge_points: lg[k]['state']['invested_forge_points'],
					forge_points_for_level_up: lg[k]['state']['forge_points_for_level_up']
				};

				lgs.push(lgd);
			}
		}

		if(lgs.length > 0){
			data.push({lgs: lgs});

			// ab zum Server
			MainParser.send2Server(data, 'OtherPlayersLGs', function(r){

				// nach Erfolg, Zeitstempel in den LocalStorage
				if(r['status'] === 'OK'){
					localStorage.setItem('LG-' + d['other_player']['player_id'], MainParser.getAddedDateTime(2, 0));
					MainParser.showInfo(d['other_player']['name'] + ' geupdated', r['msg']);
				} else {
					MainParser.showInfo('Fehler!', r['msg']);
				}
			});
		}
	},


	/**
	 *
	 * @param d
	 * @constructor
	 */
	GuildExpedition: (d)=> {

		// ab zum Server
		MainParser.send2Server(d, 'GuildExpedition', function(r)
		{
			// nach Erfolg, Zeitstempel in den LocalStorage
			if(r['status'] === 'OK'){
				localStorage.setItem('GuildExpedition', MainParser.getAddedDateTime(2, 0));
				MainParser.showInfo('Update durchgeführt', r['msg']);
			} else {
				MainParser.showInfo('Fehler!', r['msg']);
			}
		});
	},


	/**
	 * @param d
	 * @constructor
	 */
	Championship: (d)=> {

		let data = [],
			i = {
				participants: d['participants'],
				ranking: d['ranking'],
			};

		data.push(i);

		// ab zum Server
		MainParser.send2Server(data, 'Championship', function(r){

			// nach Erfolg, Zeitstempel in den LocalStorage
			if(r['status'] === 'OK'){
				localStorage.setItem('Championship', MainParser.getAddedDateTime(2, 0));
				MainParser.showInfo('Update durchgeführt', r['msg']);
			} else {
				MainParser.showInfo('Fehler!', r['msg']);
			}
		});
	},


	/**
	 * Spieler Daten sichern
	 *
	 * @param d
	 * @constructor
	 */
	StartUp: (d)=> {
		ExtGuildID = d['clan_id'];
        ExtWorld = window.location.hostname.split('.')[0];
        CurrentEra = d['era']['era'];

		chrome.runtime.sendMessage(extID, {
			type: 'storeData',
			key: 'current_guild_id',
			data: ExtGuildID
		});
		localStorage.setItem('current_guild_id', ExtGuildID);

		ExtPlayerID = d['player_id'];
		chrome.runtime.sendMessage(extID, {
			type: 'storeData',
			key: 'current_player_id',
			data: ExtPlayerID
		});
		localStorage.setItem('current_player_id', ExtPlayerID);

		chrome.runtime.sendMessage(extID, {
			type: 'storeData',
			key: 'current_world',
			data: ExtWorld
		});
		localStorage.setItem('current_world', ExtWorld);

		chrome.runtime.sendMessage(extID, {
			type: 'storeData',
			key: 'current_player_name',
			data: d['user_name']
		});
		localStorage.setItem('current_player_name', d['user_name']);

		if(devMode)
		{
			HTML.Box({
				'id': 'DevNode',
				'title': 'Hinweis!',
				'auto_close': true
			});

			setTimeout(()=>{
				let desc = 'Hey BETA-Tester!<br>Bitte immer den Cache zwischendurch leeren!<br><br>- F12 > Konsole auf<br>- Reiter "Network" > Haken bei "Disable cache"<br>- mit geöffneter Konsole neu laden';

				$('#DevNodeBody').html(desc);

			}, 200);
		}
	},


	/**
	 * Eigene Daten updaten (Gildenwechsel etc)
	 *
	 * @param d
	 * @constructor
	 */
	SelfPlayer: (d)=>{

		if(Settings.GetSetting('GlobalSend') === false)
		{
			return;
		}

		let data = {
			player_id: d['player_id'],
			user_name: d['user_name'],
			portrait_id: d['portrait_id'],
			clan_id: d['clan_id'],
		};

		// ab zum Server
		chrome.runtime.sendMessage(extID, {
			type: 'send2Api',
			url: ApiURL + 'SelfPlayer/?player_id=' + ExtPlayerID + '&guild_id=' + ExtGuildID + '&world=' + ExtWorld,
			data: JSON.stringify(data)
		});
	},


	/**
	 * LG Investitionen
	 *
	 * @param d
	 * @constructor
	 */
	GreatBuildings: (d)=>{

		// ab zum Server
		MainParser.send2Server(d, 'GreatBuildings', function(r){

			// nach Erfolg, Zeitstempel in den LocalStorage
			if(r['status'] === 'OK'){
				localStorage.setItem('GreatBuildings', MainParser.getAddedDateTime(0, 5));
				MainParser.showInfo('Update durchgeführt', r['msg']);
			} else {
				MainParser.showInfo('Fehler!', r['msg']);
			}
		});
	},


	/**
	 * Alle Gebäude sichern,
	 * Eigene LGs updaten
	 *
	 * @param d
	 * @constructor
	 */
	SaveBuildings: (d)=>{
		CityMapData = d;

		if(Settings.GetSetting('GlobalSend') === false)
		{
			return;
		}

		let lgs = [];

		for(let i in d)
		{
			if(d.hasOwnProperty(i))
			{
				if(d[i]['type'] === 'greatbuilding'){
					let b = {
						cityentity_id: d[i]['cityentity_id'],
						level: d[i]['level'],
						max_level: d[i]['max_level'],
						invested_forge_points: d[i]['state']['invested_forge_points'] || 0,
						forge_points_for_level_up: d[i]['state']['forge_points_for_level_up']
					};

					lgs.push(b);

					if(d[i]['bonus'] !== undefined && MainParser.BoostMapper[d[i]['bonus']['type']] !== undefined)
					{
						MainParser.AllBoosts[ MainParser.BoostMapper[ d[i]['bonus']['type'] ] ] += d[i]['bonus']['value']
					}
				}
			}
		}

		if(lgs.length > 0)
		{
			MainParser.apiCall(lgs, 'SelfPlayerLGs');
		}
	},


	/**
	 * Sammelt aktive Boosts der Stadt
	 *
	 * @param d
	 * @constructor
	 */
	CollectBoosts: (d)=>{
		for(let i in d)
		{
			if(d.hasOwnProperty(i))
			{
				if(MainParser.AllBoosts[d[i]['type']] !== undefined)
				{
					MainParser.AllBoosts[d[i]['type']] += d[i]['value']
				}
			}
		}
	},


	/**
	 * LGs des Spielers speichern
	 *
	 * @param d
	 * @constructor
	 */
	SaveLGInventory: (d)=>{
		chrome.runtime.sendMessage(extID, {
			type: 'send2Api',
			url: ApiURL + 'LGInventory/?player_id=' + ExtPlayerID + '&guild_id=' + ExtGuildID + '&world=' + ExtWorld,
			data: JSON.stringify(d)
		});
	},


	OtherPlayersMotivation: (d)=>{

		let page = d['page'],
			ev = d['events'],
			data = [],
			pm = [];

		data.push({page: page});

		for(let i in ev){

			if (ev.hasOwnProperty(i)) {

				if(ev[i]['type'] === 'social_interaction'){
					let pd = {
						id: ev[i]['id'],
						date: ev[i]['date'],
						entity_id: ev[i]['entity_id'] || '',
						action: ev[i]['interaction_type'] || '',
						is_friend: ev[i]['other_player']['is_friend'],
						is_guild_member: ev[i]['other_player']['is_guild_member'],
						is_neighbor: ev[i]['other_player']['is_neighbor'],
						name: ev[i]['other_player']['name'],
						player_id: ev[i]['other_player']['player_id']
					};

					pm.push(pd);

				} else if (ev[i]['type'] === 'friend_tavern_sat_down'){

					let pd = {
						id: ev[i]['id'],
						date: ev[i]['date'],
						entity_id: '',
						action: 'friend_tavern_sat_down',
						is_friend: ev[i]['other_player']['is_friend'],
						is_guild_member: ev[i]['other_player']['is_guild_member'],
						is_neighbor: ev[i]['other_player']['is_neighbor'],
						name: ev[i]['other_player']['name'],
						player_id: ev[i]['other_player']['player_id']
					};

					pm.push(pd);
				}
			}
		}

		if(pm.length > 0){
			data.push({players: pm});

			MainParser.send2Server(data, 'OtherPlayersMotivation', function(r){

				// nach Erfolg, Zeitstempel in den LocalStorage
				if(r['status'] === 'OK'){
					localStorage.setItem('OtherPlayersMotivation-' + page, MainParser.getAddedDateTime(0, 10));

					// Meldung ausgeben
					MainParser.showInfo('Spieler gefunden', r['msg'], 1600);

				} else if (r['status'] === 'NOTICE') {
					localStorage.setItem('OtherPlayersMotivation-' + page, MainParser.getAddedDateTime(1, 0));

					// Meldung ausgeben
					MainParser.showInfo('Alles aktuell!', r['msg'], 6000);
				}
			});
		}
	},


	FriendsList: (d)=>{
		let data = [];

		for(let i in d){
			if (d.hasOwnProperty(i)) {

				// nicht selbst mitschicken
				if(d[i]['player_id'] != ExtPlayerID){
					let pl = {
						avatar: d[i]['avatar'],
						city_name: d[i]['city_name'],
						player_id: d[i]['player_id'],
						clan_id: d[i]['clan_id'] || '',
						name: d[i]['name'],
						score: d[i]['score'],
						rank: d[i]['rank']
					};

					data.push(pl);
				}
			}
		}

		if(data.length > 0){
			MainParser.send2Server(data, 'FriendsList', function(r){
				localStorage.setItem('FriendsList', MainParser.getAddedDateTime(6, 0));
			});
		}
	},


	/**
	 * Übersetzungen für die Güter zusammen setzen
	 *
	 * @param d
	 */
	setGoodsNames: (d)=> {
		for(let i in d){
			if(d.hasOwnProperty(i)) {
				GoodsNames[ d[i]['id'] ] = d[i]['name'];
			}
		}
	},


	/**
	 * Titel der Chats sammeln
	 *
	 * @param d
	 */
	setConversations: (d)=> {

		let StorageHeader = localStorage.getItem('ConversationsHeaders');

		// wenn noch nichts drin , aber im LocalStorage vorhanden, laden
		if(Conversations.length === 0 && StorageHeader !== null){
			Conversations = JSON.parse(StorageHeader);
		}

		// GildenChat
		if(d['clanTeaser'] !== undefined && Conversations.filter((obj)=> (obj.id === d['clanTeaser']['id'])).length === 0){
			Conversations.push({
				id: d['clanTeaser']['id'],
				title: d['clanTeaser']['title']
			});
		}

		if(d['teasers'] !== undefined){
			// die anderen Chats
			for(let k in d['teasers']){

				if(d['teasers'].hasOwnProperty(k)){

					if(Conversations.filter((obj)=> (obj.id === d['teasers'][k]['id'])).length === 0){
						Conversations.push({
							id: d['teasers'][k]['id'],
							title: d['teasers'][k]['title']
						});
					}
				}
			}
		}

		if(d[0] !== undefined && d[0].length > 0){

			for(let k in d){
				if(d.hasOwnProperty(k)){
					if(Conversations.filter((obj)=> (obj.id === d[k]['id'])).length === 0){
						Conversations.push({
							id: d[k]['id'],
							title: d[k]['title']
						});
					}
				}
			}
		}

		if(Conversations.length > 0){
			localStorage.setItem('ConversationsHeaders', JSON.stringify(Conversations));
		}
	},


	/**
	 * Via Ajax eine jSON holen
	 *
	 */
	loadJSON: (url, callback)=> {

		let xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open('GET', url, true);
		xobj.onreadystatechange = function () {
			if (xobj.readyState == 4 && xobj.status == "200") {
				callback(xobj.responseText);
			} else {
				callback(false);
			}
		};
		xobj.send(null);
	}
};
