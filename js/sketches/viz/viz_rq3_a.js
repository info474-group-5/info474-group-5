// viz_rq3_a.js
// Visualization for RQ3: Global Player Power Index Breakdown by Court Surface

(function () {
  const Viz = {
    // Mapping of 3-letter IOC codes (from CSV) to full country names (from country.js)
    IOC_TO_FULL_NAME: {
        'USA': 'United States', 'AUS': 'Australia', 'FRA': 'France', 'GBR': 'United Kingdom',
        'GER': 'Germany', 'RUS': 'Russia', 'SUI': 'Switzerland', 'ESP': 'Spain', 'CAN': 'Canada',
        'JPN': 'Japan', 'CZE': 'Czech Republic', 'POL': 'Poland', 'BEL': 'Belgium', 'ITA': 'Italy',
        'ROU': 'Romania', 'CHN': 'China', 'SRB': 'Serbia', 'KAZ': 'Kazakhstan', 'TUN': 'Tunisia',
        'DEN': 'Denmark', 'BLR': 'Belarus', 'SVK': 'Slovakia', 'UKR': 'Ukraine', 'AUT': 'Austria',
        'NED': 'Netherlands', 'SWE': 'Sweden', 'BRA': 'Brazil', 'ARG': 'Argentina', 'IND': 'India',
        'COL': 'Colombia', 'FIN': 'Finland', 'KOR': 'South Korea', 'MEX': 'Mexico', 'NOR': 'Norway',
        'RSA': 'South Africa', 'NZL': 'New Zealand', 'PHI': 'Philippines', 'THA': 'Thailand', 'TUR': 'Turkey',
        'CRO': 'Croatia', 'GRE': 'Greece', 'EGY': 'Egypt', 'ISR': 'Israel', 'MAR': 'Morocco',
        'LTU': 'Lithuania', 'LAT': 'Latvia', 'EST': 'Estonia', 'GEO': 'Georgia', 'HUN': 'Hungary',
        'PAR': 'Paraguay', 'CHI': 'Chile', 'PER': 'Peru', 'URU': 'Uruguay', 'VEN': 'Venezuela'
    },
    SURFACES: ['Hard', 'Clay', 'Grass'],

    HOST_SLAMS: {
      'AUSTRALIAN OPEN': { fullName: 'Australia', surface: 'Hard', color: null },
      'ROLAND GARROS':   { fullName: 'France', surface: 'Clay', color: null },
      'WIMBLEDON':       { fullName: 'United Kingdom', surface: 'Grass', color: null },
      'US OPEN':         { fullName: 'United States', surface: 'Hard', color: null },
    },
    SLAMS_COLOR_MAP: {},

    // Cache for map boundaries to ensure responsive scaling
    _mapBounds: { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, calculated: false },

    draw: function (p, manager, ai, progress) {
      p.push();
      const fixedMargin = 20;
      const top = manager.offsetY || fixedMargin;
      
      // Use full available width/height for the container
      const w = manager.width || 750;
      const h = manager.height || 500;
      
      // Initialize cache
      manager._rq3a = manager._rq3a || {
        wta: null,
        countryPowerIndex: {},
        maxPower: 0,
        loading: true,
        processed: false,
        cachedWidth: 0,
        cachedHeight: 0,
        powerMin: 0,
      };
      const cache = manager._rq3a;

      const accentColor = p.color(2, 131, 131);
      const noDataColor = '#D0D0D0';

      if (!Viz.SLAMS_COLOR_MAP.Hard) {
          Viz.SLAMS_COLOR_MAP = {
              'Hard': p.color(255, 165, 0),
              'Clay': p.color(188, 70, 155),
              'Grass': p.color(2, 131, 131)
          };
      }

      if (cache.loading) {
        if (cache.wta === null) {
          p.loadTable("data/raw/wta-grandslam.csv", 'csv', 'header', function (tbl) {
            cache.wta = tbl;
            cache.loading = false;
            Viz.processData(cache);
          });
        }
        p.textSize(16);
        p.fill(100);
        p.text("Loading tennis data...", fixedMargin, top + 40);
        p.pop();
        return;
      }

      // Map margins: Space for Title/Subtitle above (70px) and Legend on right (150px)
      const titleHeight = 70;
      const legendWidth = 150;
      const sidePadding = 20;

      // Available space for the map itself
      const chartW = w - legendWidth - 2 * sidePadding;
      const chartH = h - titleHeight - fixedMargin;

      const chartX = fixedMargin;
      const chartY = top + titleHeight;

      if (window.country && (!cache.processed || cache.cachedWidth !== w || cache.cachedHeight !== h)) {
        Viz.processMapPolygons(window.country, chartW, chartH);
        cache.processed = true;
        cache.cachedWidth = w;
        cache.cachedHeight = h;
      }

      p.noStroke();
      p.fill(30);
      p.textSize(20);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.TOP);
      p.text("Global Player Power Index Breakdown by Court Surface", fixedMargin, top);
      p.textStyle(p.NORMAL);
      p.textSize(14);
      p.fill(80);
      p.text("Colored countries have player data. Hover to see the surface-specific Power Index.", fixedMargin, top + 28);

      p.push();
      p.translate(chartX, chartY);

      let hoverNode = null;

      if (!window.country || !cache.processed) {
        p.fill(200, 0, 0);
        p.text("Error: Map data initialization failed. Check console.", 20, 20);
      } else {
        // Draw Countries
        p.stroke(255);
        p.strokeWeight(0.5);

        // Mouse coordinates relative to the translated map origin
        const mouseXRel = p.mouseX - chartX;
        const mouseYRel = p.mouseY - chartY;
        const mouseVec = p.createVector(mouseXRel, mouseYRel);

        for (let c of window.country) {
          if (!c.polygons) continue;

          const countryData = cache.countryPowerIndex[c.name];

          let isHover = c.polygons.some(poly => pointInPoly(poly, mouseVec));
          let fillColor;

          if (countryData && countryData.overall_match_count > 0) {
            fillColor = accentColor;
            fillColor.setAlpha(isHover ? 255 : 200);

            if (isHover) {
              hoverNode = {
                name: c.name,
                overall_power: countryData.overall_power,
                match_count: countryData.overall_match_count,
                hard_power: countryData.Hard_power,
                clay_power: countryData.Clay_power,
                grass_power: countryData.Grass_power,
                px: p.mouseX,
                py: p.mouseY
              };
            }
          } else {
            fillColor = noDataColor;
          }

          p.fill(fillColor);

          // Draw the polygons
          for (let poly of c.polygons) {
            p.beginShape();
            for (let pt of poly) {
              p.vertex(pt.x, pt.y);
            }
            p.endShape(p.CLOSE);
          }
        }
      }

      p.pop();

      p.push();
      // Position: chartX (start) + chartW (width) + 10 (margin)
      const legendX = chartX + chartW + 10;
      p.translate(legendX, chartY);

      p.fill(0);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(14);
      p.textStyle(p.BOLD);
      p.text("Legend", 0, 0);
      p.textStyle(p.NORMAL);

      let ly = 25;

      // Data Available
      p.fill(accentColor);
      p.rect(0, ly, 12, 12);
      p.fill(60);
      p.textSize(12);
      p.text('Player Data Available', 18, ly + 2);
      ly += 25;

      // No Data Legend
      p.fill(noDataColor);
      p.rect(0, ly, 12, 12);
      p.fill(60);
      p.text('No Player Data', 18, ly + 2);
      ly += 40;

      // Power Index Note
      p.fill(0);
      p.textSize(14);
      p.text("Power Index Detail", 0, ly);
      ly += 20;
      p.textSize(12);
      p.fill(60);
      p.text("Shown on hover.", 0, ly);

      p.pop();

      if (hoverNode) {
          drawTooltip(p, hoverNode);
      }

      p.pop();
    },

    processData: function (cache) {
      let groupedByCountry = {};
      let maxOverallPower = 0;

      for (let r = 0; r < cache.wta.getRowCount(); r++) {
          const wIOC = cache.wta.getString(r, 'winner_ioc').trim().toUpperCase();
          const lIOC = cache.wta.getString(r, 'loser_ioc').trim().toUpperCase();
          const surface = cache.wta.getString(r, 'surface').trim().toUpperCase();

          if (!Viz.SURFACES.map(s => s.toUpperCase()).includes(surface)) continue;

          const getVal = (col) => {
              const str = cache.wta.getString(r, col).trim();
              const val = (str === 'NA') ? NaN : parseFloat(str);
              return isNaN(val) ? 0 : val;
          };

          const wA = getVal('w_ace');
          const lA = getVal('l_ace');
          const totalMatchAces = wA + lA;

          if (totalMatchAces < 0) continue;

          // Function to aggregate data for a single country's IOC
          const aggregateCountry = (ioc) => {
              const fullName = Viz.IOC_TO_FULL_NAME[ioc];
              if (!fullName) return;

              groupedByCountry[fullName] = groupedByCountry[fullName] || {
                  total_aces: 0,
                  match_count: 0,
                  HARD_aces: 0, HARD_count: 0,
                  CLAY_aces: 0, CLAY_count: 0,
                  GRASS_aces: 0, GRASS_count: 0,
                  fullName: fullName
              };

              // Overall Aggregation
              groupedByCountry[fullName].total_aces += totalMatchAces;
              groupedByCountry[fullName].match_count++;

              // Surface-Specific Aggregation (using uppercase keys)
              groupedByCountry[fullName][surface + '_aces'] += totalMatchAces;
              groupedByCountry[fullName][surface + '_count']++;
          };

          aggregateCountry(wIOC);
          aggregateCountry(lIOC);
      }

      // Final Calculation
      cache.countryPowerIndex = {};
      Object.values(groupedByCountry).forEach(d => {
          d.overall_power = d.match_count > 0 ? d.total_aces / d.match_count : 0;
          d.overall_match_count = d.match_count;

          // Calculate Surface-Specific Power Indices (using standard case for display)
          d.Hard_power = d.HARD_count > 0 ? d.HARD_aces / d.HARD_count : 0;
          d.Clay_power = d.CLAY_count > 0 ? d.CLAY_aces / d.CLAY_count : 0;
          d.Grass_power = d.GRASS_count > 0 ? d.GRASS_aces / d.GRASS_count : 0;

          cache.countryPowerIndex[d.fullName] = d;
          if (d.overall_power > maxOverallPower) maxOverallPower = d.overall_power;
      });

      cache.maxPower = maxOverallPower * 1.05;
    },

    processMapPolygons: function(countries, w, h) {
        // Only calculate bounds once
        if (!Viz._mapBounds.calculated) {
            for (let c of countries) {
                let cx = 0, cy = 0;
                for (let node of c.vertexPoint) {
                    if (!Array.isArray(node)) continue;
                    let command = node[0];
                    if (command === "m") {
                        cx += node[1]; cy += node[2];
                    } else if (command === "M") {
                        cx = node[1]; cy = node[2];
                    } else if (typeof command === 'number') {
                        cx += node[0]; cy += node[1];
                    }
                    Viz._mapBounds.minX = Math.min(Viz._mapBounds.minX, cx);
                    Viz._mapBounds.maxX = Math.max(Viz._mapBounds.maxX, cx);
                    Viz._mapBounds.minY = Math.min(Viz._mapBounds.minY, cy);
                    Viz._mapBounds.maxY = Math.max(Viz._mapBounds.maxY, cy);
                }
            }
            Viz._mapBounds.calculated = true;
        }

        const { minX, maxX, minY, maxY } = Viz._mapBounds;

        const dataW = maxX - minX;
        const dataH = maxY - minY;
        const scale = Math.min(w / dataW, h / dataH);

        for (let c of countries) {
            c.polygons = [];
            let cx = 0, cy = 0;
            let currentPoly = [];

            const addPoint = (x, y) => {
                currentPoly.push({
                    x: (x - minX) * scale,
                    y: (y - minY) * scale
                });
            };

            for (let node of c.vertexPoint) {
                if (!Array.isArray(node)) {
                    if (node === "z") {
                        if (currentPoly.length > 0) c.polygons.push(currentPoly);
                        currentPoly = [];
                    }
                    continue;
                }

                let command = node[0];

                if (command === "m") {
                    cx += node[1]; cy += node[2];
                    addPoint(cx, cy);
                } else if (command === "M") {
                    cx = node[1]; cy = node[2];
                    addPoint(cx, cy);
                } else if (typeof command === 'number') {
                    cx += node[0]; cy += node[1];
                    addPoint(cx, cy);
                }
            }
            if (currentPoly.length > 0) c.polygons.push(currentPoly);
        }
    }
  };

  // Helper: Point in Polygon (Ray Casting)
  function pointInPoly(verts, pt) {
    let c = false;
    for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
        if (((verts[i].y > pt.y) != (verts[j].y > pt.y)) &&
            (pt.x < (verts[j].x - verts[i].x) * (pt.y - verts[i].y) / (verts[j].y - verts[i].y) + verts[i].x)) {
            c = !c;
        }
    }
    return c;
  }

  // Helper: Tooltip (Shows surface breakdown)
  function drawTooltip(p, node) {
      // Helper function for display
      const displayValue = (val) => val > 0 ? val.toFixed(2) : 'N/A';

      const lines = [
          node.name,
          `Total Matches Contributed: ${node.match_count}`,
          `-- Overall Power Index --`,
          `Avg Aces (Overall): ${node.overall_power.toFixed(2)}`,
          `-- Power Index by Surface --`,
          `Hard Court: ${displayValue(node.hard_power)}`,
          `Clay Court: ${displayValue(node.clay_power)}`,
          `Grass Court: ${displayValue(node.grass_power)}`
      ];
      p.textSize(12);
      let mw = 0;
      for(let l of lines) mw = Math.max(mw, p.textWidth(l));

      const bx = node.px + 10;
      const by = node.py - 10 - (lines.length * 16);
      const bw = mw + 16;
      const bh = lines.length * 16 + 10;

      p.fill(255, 230);
      p.stroke(0, 100);
      p.rect(bx, by, bw, bh, 5);

      p.noStroke();
      p.fill(0);
      p.textAlign(p.LEFT, p.TOP);
      let ty = by + 8;
      for(let l of lines) {
          if (l.startsWith('--')) {
              p.textStyle(p.BOLD);
              p.text(l, bx + 8, ty);
              p.textStyle(p.NORMAL);
          } else {
              p.text(l, bx + 8, ty);
          }
          ty += 16;
      }
  }

  window.Viz_RQ3_a = Viz;
})();