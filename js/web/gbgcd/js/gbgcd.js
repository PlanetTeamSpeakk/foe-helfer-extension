class Province {
    constructor(map, id, name) {
        this.map = map;
        this.id = id;
        this.name = name;

        this.neighborNames = new Set();
        this.slotCount = 0;
        this.ours = false;
        this.isSpawnSpot = false;
        this.desiredCount = 0;
    }

    get neighbors() {
        return new Set(Array.from(this.neighborNames).map(pname => this.map.provinces[pname]));
    }

    init(slotCount, ours, isSpawnSpot) {
        this.slotCount = slotCount;
        this.ours = ours;
        this.isSpawnSpot = isSpawnSpot;
    }

    addNeighbor(province) {
        this.neighborNames.add(province);
        this.map.provinces[province].neighborNames.add(this.name);
    }
}

class GBGMap {
    constructor() {
        /**
         * The provinces in this map.
         * @type {{string: Province}}
         */
        this.provinces = {};
    }

    // Must be overridden by subclasses
    /**
     * Converts a province id to its name.
     * This is primarily possible because province names follow a pretty strict pattern.
     * @param id {number} The id to convert
     * @return {string} The name of the province associated with the given id
     */
    idToName(id) {}
}

class VolcanoArchipelagoMap extends GBGMap {
    constructor() {
        super();

        // First ring
        this.provinces["A1M"] = new Province(this, 0, "A1M");
        this.provinces["B1O"] = new Province(this, 1, "B1O");
        this.provinces["C1N"] = new Province(this, 2, "C1N");
        this.provinces["D1B"] = new Province(this, 3, "D1B");

        for (let i = 0; i < 4; i++)
        {
            let quarterId = GBGCD.sumChar('A', i);

            // Second ring
            for (let j = 0; j < 2; j++)
            {
                let name = `${quarterId}2${GBGCD.sumChar('S', j)}`;
                this.provinces[name] = new Province(this, 4 + i * 2 + j, name);
            }

            // Third ring
            for (let j = 0; j < 4; j++)
            {
                let name = `${quarterId}3${GBGCD.sumChar('V', (j === 0 ? 0 : j + 1))}`;
                this.provinces[name] = new Province(this, 4 + 8 + i * 4 + j, name);
            }

            // Fourth ring
            for (let j = 0; j < 8; j++)
            {
                let name = `${quarterId}4${GBGCD.sumChar('A', j)}`;
                this.provinces[name] = new Province(this, 4 + 8 + 16 + i * 8 + j, name);
            }
        }

        let add = (province, ...provinces) => {
            for (let neighbour of provinces)
                this.provinces[province].addNeighbor(neighbour);
        }

        // Surely there's a way to automate this, but this was easier
        // than figuring out the pattern.
        // First ring
        add("A1M", "A2S", "A2T", "B1O", "D1B");
        add("B1O", "A1M", "B2S", "B2T", "C1N");
        add("C1N", "D1B", "B1O", "C2S", "C2T");
        add("D1B", "D2T", "A1M", "C1N", "D2S");


        // Second ring
        add("A2S", "A3V", "A3X", "A2T", "A1M", "D2T");
        add("A2T", "A3Y", "A3Z", "B2S", "A1M", "A2S");
        add("B2S", "A2T", "B3V", "B3X", "B2T", "B1O");
        add("B2T", "B1O", "B2S", "B3Y", "B3Z", "C2S");
        add("C2S", "C1N", "B2T", "C3V", "C3X", "C2T");
        add("C2T", "D2S", "C1N", "C2S", "C3Y", "C3Z");
        add("D2S", "D2T", "D1B", "C2T", "D3V", "D3X");
        add("D2T", "D3Y", "D3Z", "A2S", "D1B", "D2S");


        // Third ring
        add("A3V", "A3X", "A2S", "D3Z");
        add("A3X", "A3Y", "A2S", "A3V");
        add("A3Y", "A3Z", "A2T", "A3X");
        add("A3Z", "B3V", "A2T", "A3Y");
        add("B3V", "B3X", "B2S", "A3Z");
        add("B3X", "B3Y", "B2S", "B3V");
        add("B3Y", "B3Z", "B2T", "B3X");
        add("B3Z", "C3V", "B2T", "B3Y");
        add("C3V", "C3X", "C2S", "B3Z");
        add("C3X", "C3Y", "C2S", "C3V");
        add("C3Y", "C3Z", "C2T", "C3X");
        add("C3Z", "D3V", "C2T", "C3Y");
        add("D3V", "D3X", "D2S", "C3V");
        add("D3X", "D3Y", "D2S", "D3V");
        add("D3Y", "D3Z", "D2T", "D3X");
        add("D3Z", "A3V", "D2T", "D3Y");


        // Fourth ring
        add("A4A", "D4H", "A3V", "A4B");
        add("A4B", "A4A", "A3V", "A4C");
        add("A4C", "A4B", "A3X", "A4D");
        add("A4D", "A4C", "A3X", "A4E");
        add("A4E", "A4D", "A3Y", "A4F");
        add("A4F", "A4E", "A3Y", "A4G");
        add("A4G", "A4F", "A3Z", "A4H");
        add("A4H", "A4G", "A3Z", "B4A");
        add("B4A", "A4H", "B3V", "B4B");
        add("B4B", "B4A", "B3V", "B4C");
        add("B4C", "B4B", "B3X", "B4D");
        add("B4D", "B4C", "B3X", "B4E");
        add("B4E", "B4D", "B3Y", "B4F");
        add("B4F", "B4E", "B3Y", "B4G");
        add("B4G", "B4F", "B3Z", "B4H");
        add("B4H", "B4G", "B3Z", "C4A");
        add("C4A", "B4H", "C3V", "C4B");
        add("C4B", "C4A", "C3V", "C4C");
        add("C4C", "C4B", "C3X", "C4D");
        add("C4D", "C4C", "C3X", "C4E");
        add("C4E", "C4D", "C3Y", "C4F");
        add("C4F", "C4E", "C3Y", "C4G");
        add("C4G", "C4F", "C3Z", "C4H");
        add("C4H", "C4G", "C3Z", "D4A");
        add("D4A", "C4H", "D3V", "D4B");
        add("D4B", "D4A", "D3V", "D4C");
        add("D4C", "D4B", "D3X", "D4D");
        add("D4D", "D4C", "D3X", "D4E");
        add("D4E", "D4D", "D3Y", "D4F");
        add("D4F", "D4E", "D3Y", "D4G");
        add("D4G", "D4F", "D3Z", "D4H");
        add("D4H", "D4G", "D3Z", "A4A");
    }

    idToName(id) {
        // First ring (4 tiles)
        if (id < 4) return GBGCD.sumChar('A', id) + "1" + (id === 0 ? 'M' : id === 1 ? 'O' : id === 2 ? 'N' : 'B');

        // Second ring (8 tiles)
        if (id < 4 + 8) return `${GBGCD.sumChar('A', (id - 4) / 2)}2${id % 2 === 0 ? 'S' : 'T'}`;

        // Third ring (16 tiles)
        if (id < 4 + 8 + 16) return `${GBGCD.sumChar('A', (id - 4 - 8) / 4)}3${id % 4 === 0 ? 'V' : GBGCD.sumChar('W', id % 4)}`;

        // Fourth ring (32 tiles)
        if (id < 4 + 8 + 16 + 32) return `${GBGCD.sumChar('A', (id - 4 - 8 - 16) / 8)}4${GBGCD.sumChar('A', (id - 28) % 8)}`;
    }
}

class WaterfallArchipelagoMap extends GBGMap {
    constructor() {
        super()

        // First ring
        this.provinces["X1X"] = new Province(this, 0, "X1X");

        for (let i = 0; i < 6; i++)
        {
            let quarterId = GBGCD.sumChar('A', i);

            // Second ring
            let name = `${quarterId}2A`;
            this.provinces[name] = new Province(this, i + 1, name);

            // Third ring
            for (let j = 0; j < 2; j++)
            {
                let name = `${quarterId}3${j === 0 ? 'A' : 'B'}`;
                this.provinces[name] = new Province(this, 1 + 6 + i * 2 + j, name);
            }

            // Fourth ring
            for (let j = 0; j < 3; j++)
            {
                let name = `${quarterId}4${GBGCD.sumChar('A', j)}`;
                this.provinces[name] = new Province(this, 1 + 6 + 12 + i * 3 + j, name);
            }

            // Fifth ring
            for (let j = 0; j < 4; j++)
            {
                let name = `${quarterId}5${GBGCD.sumChar('A', j)}`;
                this.provinces[name] = new Province(this, 1 + 6 + 12 + 18 + i * 4 + j, name);
            }
        }

        let add = (province, ...provinces) => {
            for (let neighbour of provinces)
                this.provinces[province].addNeighbor(neighbour);
        }

        // First ring
        add("X1X", "A2A", "B2A", "C2A", "D2A", "E2A", "F2A");


        // Second ring
        for (let i = 0; i < 6; i++) {
            let ch = GBGCD.sumChar('A', i);
            let prevCh = GBGCD.sumChar('A', (i + 5) % 6);

            add(ch + "2A", ch + "3A", ch + "3B", GBGCD.sumChar('A', (i + 1) % 6) + "2A", "X1X",
                prevCh + "2A", prevCh + "3B");
        }


        // Third ring
        add("A3A", "A4A", "A4B", "A3B", "A2A", "F3B", "F4C");
        add("A3B", "A4C", "B3A", "B2A", "A2A", "A3A", "A4B");
        add("B3A", "B4A", "B4B", "B3B", "B2A", "A3B", "A4C");
        add("B3B", "B4C", "C3A", "C2A", "B2A", "B3A", "B4B");
        add("C3A", "C4A", "C4B", "C3B", "C2A", "B3B", "B4C");
        add("C3B", "C4C", "D3A", "D2A", "C2A", "C3A", "C4B");
        add("D3A", "D4A", "D4B", "D3B", "D2A", "C3B", "C4C");
        add("D3B", "D4C", "E3A", "E2A", "D2A", "D3A", "D4B");
        add("E3A", "E4A", "E4B", "E3B", "E2A", "D3B", "D4C");
        add("E3B", "E4C", "F3A", "F2A", "E2A", "E3A", "E4B");
        add("F3A", "F4A", "F4B", "F3B", "F2A", "E3B", "E4C");
        add("F3B", "F4C", "A3A", "A2A", "F2A", "F3A", "F4B");


        // Fourth ring
        add("A4A", "A5A", "A5B", "A4B", "A3A", "F4C", "F5D");
        add("A4B", "A5B", "A5C", "A4C", "A3B", "A3A", "A4A");
        add("A4C", "A5D", "B4A", "B3A", "A3B", "A4B", "A5C");
        add("B4A", "B5A", "B5B", "B4B", "B3A", "A4C", "A5D");
        add("B4B", "B5B", "B5C", "B4C", "B3B", "B3A", "B4A");
        add("B4C", "B5D", "C4A", "C3A", "B3B", "B4B", "B5C");
        add("C4A", "C5A", "C5B", "C4B", "C3A", "B4C", "B5D");
        add("C4B", "C5B", "C5C", "C4C", "C3B", "C3A", "C4A");
        add("C4C", "C5D", "D5A", "D4A", "D3A", "C3B", "C4B");
        add("D4A", "D5A", "D5B", "D4B", "D3A", "C4C", "C5D");
        add("D4B", "D5C", "D4C", "D3B", "D3A", "D4A", "D5B");
        add("D4C", "D5D", "E4A", "E3A", "D3B", "D4B", "D5C");
        add("E4A", "E5A", "E5B", "E4B", "E3A", "D4C", "D5D");
        add("E4B", "E5C", "E4C", "E3B", "E3A", "E4A", "E5B");
        add("E4C", "E5D", "F4A", "F3A", "E3B", "E4B", "E5C");
        add("F4A", "F5A", "F5B", "F4B", "F3A", "E4C", "E5D");
        add("F4B", "F5C", "F4C", "F3B", "F3A", "F4A", "F5B");
        add("F4C", "F5D", "A4A", "A3A", "F3B", "F4B", "F5C");

        // Fifth ring
        add("A5A", "F5D", "A4A", "A5B");
        add("A5B", "A5A", "A4A", "A4B", "A5C");
        add("A5C", "A5B", "A4B", "A4C", "A5D");
        add("A5D", "A5C", "A4C", "B4A", "B5A");
        add("B5A", "A5D", "B4A", "B5B");
        add("B5B", "B5A", "B4A", "B4B", "B5C");
        add("B5C", "B5B", "B4B", "B4C", "B5D");
        add("B5D", "B5C", "B4C", "C4A", "C5A");
        add("C5A", "B5D", "C4A", "C5B");
        add("C5B", "C5A", "C4A", "C4B", "C5C");
        add("C5C", "C5B", "C4B", "C4C", "C5D");
        add("C5D", "C5C", "C4C", "D4A", "D5A");
        add("D5A", "C5D", "D4A", "D5B");
        add("D5B", "D5A", "D4A", "D4B", "D5C");
        add("D5C", "D5B", "D4B", "D4C", "D5D");
        add("D5D", "D5C", "D4C", "E4A", "E5A");
        add("E5A", "D5D", "E4A", "E5B");
        add("E5B", "E5A", "E4A", "E4B", "E5C");
        add("E5C", "E5B", "E4B", "E4C", "E5D");
        add("E5D", "E5C", "E4C", "F4A", "F5A");
        add("F5A", "E5D", "F4A", "F5B");
        add("F5B", "F5A", "F4A", "F4B", "F5C");
        add("F5C", "F5B", "F4B", "F4C", "F5D");
        add("F5D", "F5C", "F4C", "A4A", "A5A");
    }

    idToName(id) {
        // First ring (1 tile)
        if (id < 1) return "X1X";

        // Second ring (6 tiles)
        if (id < 1 + 6) return `${GBGCD.sumChar('A', id - 1)}2A`;

        // Third ring (12 tiles)
        if (id < 1 + 6 + 12) return `${GBGCD.sumChar('A', (id - 1 - 6) / 2)}3${id % 2 === 1 ? 'A' : 'B'}`;

        // Fourth ring (18 tiles)
        if (id < 1 + 6 + 12 + 18) return `${GBGCD.sumChar('A', (id - 1 - 6 - 12) / 3)}4${GBGCD.sumChar('A', (id - 1) % 3)}`;

        // Fifth ring (24 tiles)
        if (id < 1 + 6 + 12 + 18 + 24) return `${GBGCD.sumChar('A', (id - 1 - 6 - 12 - 18) / 4)}5${GBGCD.sumChar('A', (id - 1) % 4)}`;
    }
}


// This registers handlers and provides the GBGCD class.
const GBGCD = (function () {   // Detach from global scope
    // Server time
    FoEproxy.addHandler("TimeService", "updateTime", data => GBGCD.time = data.responseData.time);

    // Battleground
    FoEproxy.addHandler("GuildBattlegroundService", "getBattleground", data => {
        if (!GBGCD.guild) return; // Ensure we have our guild.

        GBGCD.map = parseBattlegrounds(data.responseData);

        if (GBGCD.map) GBGCDWindow.enableToolBtn();
        GBGCDWindow.updateData();
    });

    // Guild data
    FoEproxy.addHandler("StartupService", "getData", data => {
        let userData = data["responseData"]["user_data"];
        GBGCD.guild = {
            name: userData["clan_name"],
            id: userData["clan_id"]
        };
    });

    // Built camps storage
    FoEproxy.addHandler("GuildBattlegroundBuildingService", "getBuildings", data => {
        let province = data.responseData.provinceId || 0;
        let pName = GBGCD.map.idToName(province);
        if (!GBGCD.map.provinces[pName].ours) return;

        let built = data.responseData.placedBuildings
            .filter(building => building.id === "siege_camp")
            .length;

        if (GBGCD.builtCamps[province] === built) return;
        GBGCD.builtCamps[province] = built;

        if (!GBGCD.map) return;

        // Redistribute the camps if this tile already has more camps
        // than we bargained for.
        if (built > GBGCD.map.provinces[pName].desiredCount)
            GBGCD.redistribute();

        GBGCDWindow.updateData();

        // Auto-open window if the user goes to the buildings tab.
        if (!$("#gbgcd").length)
            GBGCDWindow.show(true);
    });

    // Province ownership changes (province conquered/lost)
    FoEproxy.addWsHandler("GuildBattlegroundService", "getAction", data => {
        if (!GBGCD.map) return;

        let action = data.responseData.action;
        let provinceId = data.responseData.provinceId || 0;

        if (action === "building_placed" && data.responseData.buildingId === "siege_camp") {
            if (!GBGCD.builtCamps[provinceId]) GBGCD.builtCamps[provinceId] = 0;
            GBGCD.builtCamps[provinceId]++;

            // If the amount of built camps has exceeded the desired amount, see if we can redistribute them.
            // Otherwise, keep the current distribution. This prevents the desired camps being shuffled
            // around while building the camps this extension suggests.
            if (GBGCD.map.provinces[GBGCD.map.idToName(provinceId)].desiredCount < GBGCD.builtCamps[provinceId])
                distributeCamps(GBGCD.map, GBGCDWindow.settings.campTarget);

            GBGCDWindow.updateData();
            return;
        }

        // Ignore actions other than province conquered or lost
        if (action !== "province_conquered" && action !== "province_lost") return;

        GBGCD.map.provinces[GBGCD.map.idToName(provinceId)].ours = action === "province_conquered";

        distributeCamps(GBGCD.map, GBGCDWindow.settings.campTarget);
        GBGCDWindow.updateData();
    });

    // Define shuffle method for arrays.
    Object.defineProperty(Array.prototype, "shuffle", {
        value: function () {
            return this
                .map(v => ({v: v, r: Math.random()}))
                .sort((v1, v2) => v1.r - v2.r)
                .map(({v}) => v);
        }
    });

    /**
     * Parses the battleground from a request and distributes camps.
     * @param resp {{string: any}}
     */
    function parseBattlegrounds(resp) {
        // Acquire our guild's participant id.
        let pid;
        for (let participant of resp.battlegroundParticipants)
            if (participant.clan.id === GBGCD.guild.id) {
                pid = participant.participantId;
                break;
            }

        if (!pid) return;

        let mapData = resp.map;
        let map;
        switch (mapData.id) {
            case "volcano_archipelago":
                map = new VolcanoArchipelagoMap();
                break;
            case "waterfall_archipelago":
                map = new WaterfallArchipelagoMap();
                break;
            default:
                console.warn("Unsupported map! " + mapData.id);
                return;
        }

        for (let province of mapData.provinces) {
            let id = province.id || 0; // First province is missing id key;
            let name = map.idToName(id);

            let isSpawnSpot = "isSpawnSpot" in province && province.isSpawnSpot;
            map.provinces[name].init(isSpawnSpot ? 0 : // Spawn spots have no camps
                province["totalBuildingSlots"] || 0, province["ownerId"] === pid, isSpawnSpot);
        }

        // Distribute camps if this is the first time the map is loaded.
        distributeCamps(map, GBGCDWindow.settings.campTarget);
        return map;
    }

    /**
     * Distributes camps across the entire map ensuring that every
     * opposing province has at least the given amount of camps
     * surrounding it, if possible.
     * @param map {GBGMap} The map to distribute camps on
     * @param campTarget {number} The amount of camps each province
     * should be supported by.
     */
    function distributeCamps(map, campTarget) {
        for (let p of Object.values(map.provinces))
            p.desiredCount = GBGCD.builtCamps[p.id] || 0; // Reset map first

        for (let p of Object.values(map.provinces).shuffle()) {
            if (p.ours || p.isSpawnSpot) continue; // Don't take provinces we can't hit into account.

            let ours = Array.from(p.neighbors).filter(n => n.ours); // Neighboring provinces that are ours
            let totalCC = ours // The total amount of slots this province's neighbors have.
                .map(n => n.slotCount)
                .reduce((i1, i2) => i1 + i2, 0);

            // We cannot achieve the desired amount of camps.
            // Simply give each neighboring province the maximum amount of camps it can hold.
            if (totalCC <= campTarget) {
                for (let neighbour of ours)
                    neighbour.desiredCount = neighbour.slotCount;
                continue;
            }

            // Calculate how many camps we need to reach the target of 4.
            // Take the camps we've already placed into account as well.
            let campsLeft = ours
                .map(op => op.desiredCount)
                .reduce((total, current) => total - current, campTarget);

            // Order by desired count ascending, so we add camps to tiles
            // with the least amount of slots filled first.
            ours = ours.sort((p1, p2) => p1.desiredCount < p2.desiredCount ? -1 : p1.desiredCount > p2.desiredCount ? 1 : 0);

            while (campsLeft > 0)
                for (let neighbor of ours) {
                    // If this province can't hold any more camps, continue to the next.
                    if (neighbor.slotCount === neighbor.desiredCount) continue;

                    campsLeft -= 1;
                    neighbor.desiredCount += 1;

                    if (campsLeft === 0) break;
                }
        }
    }

    class GBGCD {
        /**
         * Information on our guild. If not set, the user likely is not in a guild.
         * Contains name and id.
         * @type {{id: number, name: string}}
         */
        static guild;
        /**
         * The last time received from the server. Should be some epoch time.
         * Received pretty often (basically with every json request).
         * @type {number}
         */
        static time;
        /**
         * The parsed map, <code>null</code> until set.
         * @type {?GBGMap}
         */
        static map;
        /**
         * An object mapping province ids to camps built on that province.
         * A province is only contained in this object if the amount of camps
         * built there is known. I.e. the user has visited the Buildings menu
         * of the province.
         * @type {{int: int}}
         */
        static builtCamps = {};

        /**
         * Sums a char and some other variable
         * @param char {string} A string containing a single character
         * @param i {number} The number to add
         * @return The character formed from summing the char code of the given char and the given number.
         */
        static sumChar(char, i) {
            return String.fromCharCode(char.charCodeAt(0) + i);
        }

        /**
         * Redistributes camps on the map with the given camp target.
         * @param campTarget {number} The amount of camps every province should be supported by.
         */
        static redistribute(campTarget = undefined) {
            if (campTarget === undefined) campTarget = GBGCDWindow.settings.campTarget;

            distributeCamps(this.map, campTarget);
            GBGCDWindow.updateData();
        }
    }
    return GBGCD;
})();

/**
 * This class merely handles displaying the data in a box on the screen.
 * Parsing the map and distributing camps is handled by the GBGCD class.
 */
class GBGCDWindow {
    /**
     *
     * @type {{showFilled: boolean, campTarget: number, showBadge: boolean, autoOpen: boolean, sortMethod: number}}
     */
    static settings = {showFilled: true, campTarget: 4, showBadge: true, autoOpen: true, sortMethod: 1};

    /**
     * Shows this window. Hides the existing one instead if there is already one open.
     */
    static show(auto = false) {
        if (auto && !this.settings.autoOpen) return;

        // If the window is currently open, close it.
        if ($('#gbgcd').length > 0)
        {
            HTML.CloseOpenBox('gbgcd');
            return;
        }

        HTML.AddCssFile("gbgcd");

        HTML.Box({
            id: 'gbgcd',
            title: "GBG Camp Distributor",
            auto_close: true,
            dragdrop: true,
            minimize: true,
            settings: 'GBGCDWindow.showSettings()'
        });

        $("#gbgcdBody")
            .append($(`<small class="visit-first">For the best results, visit the buildings menu of each province first.</small>`))
            .append($(`<h4 class="text-center">Camps to build:</h4>`))
            .append($(`<table class="foe-table">
                           <thead>
                               <tr>
                                   <th>Province</th>
                                   <th>Camps</th>
                                   <th>Province</th>
                                   <th>Camps</th>
                               </tr>
                           </thead>
                           <tbody id="gbgcd__provinces">
                               <tr>
                                   <td colspan="4"><strong class="no-provinces text-center">No provinces to show here</strong></td>
                               </tr>
                           </tbody>
                       </table>`))
            .append($(`<div class="dark-bg" style="padding: 5px">
                           <table style="width: 100%">
                               <tbody>
                                   <tr>
                                       <td><span>Left to build: <strong id="left-to-build">0</strong></span></td>
                                       <td class="text-right"><span>Total saved: <strong id="total-saved">0</strong></span></td>
                                   </tr>
                                   <tr>
                                       <td><span>Overshot: <strong id="overshot">0</strong></span></td>
                                       <td class="text-right"><span>Undershot: <strong id="undershot">0</strong></span></td>
                                   </tr>
                               </tbody>
                           </table>
                       </div>`)
                .append($("<div class='mx-auto h-stack mt-2'>")
                    .append($(`<button class="btn btn-default" title="Redistribute the camps across the board">Redistribute</button>`)
                        .on("click", () => GBGCD.redistribute(this.settings.campTarget)))
                    .append($(`<button class="btn btn-default btn-delete" title="Clear all known built camps">Clear built camps</button>`)
                        .on("click", () => GBGCD.redistribute(this.settings.campTarget)))))
            .parent().css({width: "285px"});
        this.updateData();
    }

    static updateData() {
        if (!GBGCD.map) return;

        let table = $("#gbgcd__provinces");
        let boxOpen = table.length > 0;

        table.empty(); // Ensure it's empty when we start.

        // Create a sort method based on the sort method selected by the user.
        let sm = this.settings.sortMethod;
        let sortMethod = sm === 0 ? (p1, p2) => p1.name.localeCompare(p2.name) :
            sm === 1 ? (p1, p2) => p1.id > p2.id ? 1 : p1.id < p2.id ? -1 : 0 :
                (p1, p2) => {
                    // If the regions of these two provinces are not the same,
                    // use whatever value represents
                    let sortRegion = p1.name.substring(0, 1).localeCompare(p2.name.substring(0, 1));
                    if (sortRegion !== 0) return sortRegion;

                    return p1.id > p2.id ? 1 : p1.id < p2.id ? -1 : 0;
                };

        let row;
        let count = 0;
        let leftToBuild = 0;
        let totalSaved = 0;
        for (let province of Object.values(GBGCD.map.provinces).sort(sortMethod)) {
            // Ignore provinces that aren't ours or that don't have to be filled.
            if (!province.ours || province.slotCount === 0) continue;

            totalSaved += province.slotCount - province.desiredCount;
            if (!this.settings.showFilled && province.id in GBGCD.builtCamps &&
                GBGCD.builtCamps[province.id] >= province.desiredCount) continue;
            leftToBuild += province.id in GBGCD.builtCamps ? Math.max(0, province.desiredCount -  GBGCD.builtCamps[province.id]) : province.desiredCount;

            // If the window is not open, ignore the rows.
            // We're only really interested in the total amount of
            // camps saved in this case.
            if (!boxOpen) continue;

            if (count % 2 === 0) {
                // Create a new row.
                if (row) table.append(row);
                row = $("<tr>");
            }

            let campsColumn = $("<td>")
                .append($("<span>")
                    .addClass(province.desiredCount < province.slotCount ? "saved" : "")
                    .text(`${province.desiredCount}/${province.slotCount}`));

            if (province.id in GBGCD.builtCamps) {
                let built = GBGCD.builtCamps[province.id];
                campsColumn
                    .append(" ")
                    .append($(`<span class="built" title="${built} camp${built === 1 ? "" : "s"} already built">(${built})</span>`));
            }

            row
                .append($("<td>")
                    .text(province.name))
                .append(campsColumn);
            count++;
        }

        $("#gbgcd-count")
            .text(`${totalSaved}`)
            .css({display: this.settings.showBadge ? "initial" : "none"});

        if (!boxOpen) return; // Rest is all box-related

        // If we did not find any provinces to display,
        // display a message we didn't find any instead.
        if (!count) table
            .append($("<tr>")
                .append($(`<td class="text-center" colspan="4">`)
                    .append(`<span class="no-provinces">No provinces to show here</span>`)));
        else {
            if (count % 2 === 1)
                // Add two empty cells
                row.append($("<td>")).append($("<td>"));

            table.append(row);
        }

        // Set total saved and left to build
        $("#total-saved")
            .attr("class", totalSaved === 0 ? "" : "saved")
            .text(`${totalSaved}`);
        $("#left-to-build").text(`${leftToBuild}`);

        // Map every province to the amount of camps it has according to our distribution.
        let campCounts = Object.values(GBGCD.map.provinces)
            .filter(p => !p.isSpawnSpot && !p.ours)
            .map(p => ({p: p, c: Array.from(p.neighbors)
                    .map(p0 => p0.desiredCount)
                    .reduce((total, current) => total + current, 0)}));

        /**
         * Updates the over- or undershots
         * @param type {string} Either 'overshot' or 'undershot'
         * @param shots {[]} The actual overshots or undershots.
         */
        function updateShots(type, shots) {
            $(`#${type}`)
                .text(`${shots.length}`)
                .parent().attr("title", GBGCDWindow.joinNicely(shots.map(p => `${p.p.name} (${p.c})`)));
        }

        let undershot = campCounts.filter(p => p.c < this.settings.campTarget);
        updateShots("undershot", undershot);

        let overshot = campCounts.filter(p => p.c > this.settings.campTarget);
        updateShots("overshot", overshot);
    }

    /**
     * Hides the red border of the tool button in the menu.
     */
    static enableToolBtn() {
        $("#gbgcd-Btn").removeClass("hud-btn-red");
        $("#gbgcd-Btn-closed").remove();
    }

    static showSettings() {
        $('#gbgcdSettingsBox')
            .empty()
            // Show badge
            .append($("<p>")
                .append($(`<input id="gbgcd__show-badge" type="checkbox">`)
                    .prop("checked", this.settings.showBadge))
                .append($(`
                  <label for="gbgcd__show-badge" 
                    title="Whether to show the badge that displays the amount of camps saved in the menu.">
                    Show badge
                  </label>
                `)))

            // Auto-open
            .append($("<p>")
                .append($(`<input id="gbgcd__auto-open" type="checkbox">`)
                    .prop("checked", this.settings.autoOpen))
                .append($(`
                  <label for="gbgcd__auto-open" 
                    title="Whether to automatically open this tool when going to the buildings page of any province you own.">
                    Auto-open
                  </label>
                `)))

            // Show filled
            .append($("<p>")
                .append($(`<input id="gbgcd__show-filled" type="checkbox">`)
                    .prop("checked", this.settings.showFilled))
                .append($(`
                  <label for="gbgcd__show-filled" 
                    title="Whether to show provinces that already have the desired amount of camps built.">
                    Show filled
                  </label>
                `)))

            // Camp target
            .append($(`<p>`)
                .append($(`<input id="gbgcd__camp-target" type="number" name="Camp Target" min="1" max="5">`)
                    .prop("value", this.settings.campTarget))
                .append($(`<label for="gbgcd__camp-target"
                title="The amount of camps each opposing province should be supported by. 4 by default.">Camp target</label>`)))

            // Sort mode
            .append($("<p>")
                .append($(`<div class="dropdown">`)
                    .append($(`<input type="checkbox" class="dropdown-checkbox" id="gbgcd__sort-toggle">`)) // Required to toggle the dropdown
                    .append($(`<label class="dropdown-label game-cursor" for="gbgcd__sort-toggle">Sort</label>`))
                    .append($(`<span class="arrow"></span>`)) // Arrow to display dropdown status
                    .append($(`
                        <ul id="gbgcd__sort-dropdown">
                            <li>
                                <label>
                                    <input type="radio" name="sort"/>
                                    By Name
                                </label>
                            </li>
                            <li>
                                <label>
                                    <input type="radio" name="sort"/>
                                    By Ring
                                </label>
                            </li>
                            <li>
                                <label>
                                    <input type="radio" name="sort"/>
                                    By Region
                                </label>
                            </li>
                        </ul>
                    `))))

            // Save button
            .append($("<p>")
                .append($("<button class='btn btn-default' style='width: 100%'>")
                    .on("click", this.saveSettings)
                    .text(i18n('Boxes.Settings.Save'))));

        // Set selected sort method
        $(`#gbgcd__sort-dropdown input:radio[name="sort"]`)
            .eq(this.settings.sortMethod)
            .prop("checked", true);

        this.updateData();
    }

    static saveSettings() {
        let isChecked = id => $("#gbgcd__" + id).is(":checked")

        let s = GBGCDWindow.settings;
        s.showBadge = isChecked("show-badge");
        s.autoOpen = isChecked("auto-open");
        s.showFilled = isChecked("show-filled");
        s.campTarget = parseInt($("#gbgcd__camp-target").val() ?? "4");

        // Save index of selected sort method radiobutton.
        let sortBtns = $(`#gbgcd__sort-dropdown input:radio[name="sort"]`);
        s.sortMethod = sortBtns.index(sortBtns.filter(":checked"));

        localStorage.setItem("gbgcdSettings", JSON.stringify(s));
        GBGCDWindow.updateData();

        $("#gbgcdSettingsBox").remove();
    }

    /**
     * Joins an array into a string of the form '..., ..., ... and ...'.
     * @param a {[]}
     * @return {string} The resulting string
     */
    static joinNicely(a) {
        let s = "";
        for (let i = 0; i < a.length; i++)
            s += a[i] + (i === a.length - 2 ? " and " : i === a.length - 1 ? "" : ", ");

        return s;
    }
}

// Load settings or set defaults if no saved settings are found.
(function() {
    let settings = localStorage.getItem("gbgcdSettings");

    // If settings are stored, load those. Otherwise, use defaults.
    if (!settings) return;

    let old = GBGCDWindow.settings;
    GBGCDWindow.settings = JSON.parse(settings);

    // If any new options were added since last save,
    // load the defaults for those.
    for (let opt in old)
        if (GBGCDWindow.settings[opt] === undefined)
            GBGCDWindow.settings[opt] = old[opt];
})();
