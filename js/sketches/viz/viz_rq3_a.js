// viz_rq3_a.js
// Visualization for RQ3: Global Player Power Index Breakdown by Court Surface

(function () {
  const Viz = {
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
 
    state: {
      selectedSurface: 'Overall',
      prevMousePressed: false,
      buttonBounds: null
    },

    COLORS: {
      Overall: [2, 131, 131],
      Hard: [255, 140, 0],
      Clay: [220, 60, 60],
      Grass: [50, 205, 50],
      NoData: '#E0E0E0'
    },

    SURFACES: ['Hard', 'Clay', 'Grass'],

    _mapBounds: { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, calculated: false },

    draw: function (p, manager, ai, progress) {
      p.push();
      const fixedMargin = 20;
      const top = manager.offsetY || fixedMargin;
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
        cachedHeight: 0
      };
      const cache = manager._rq3a;

      // Load Data
      if (cache.loading) {
        if (cache.wta === null) {
          p.loadTable("data/raw/wta-grandslam.csv", 'csv', 'header', function (tbl) {
            cache.wta = tbl;
            cache.loading = false;
            Viz.processData(cache);
          });
        }
        p.textAlign(p.CENTER);
        p.text("Loading tennis data...", w / 2, h / 2);
        p.pop();
        return;
      }

      const headerAreaHeight = 130; 
      const legendWidth = 220;
      const sidePadding = 20;
      
      const chartW = w - legendWidth - 2 * sidePadding;
      const chartH = h - headerAreaHeight - fixedMargin; 

      const chartX = fixedMargin;
      const chartY = top + headerAreaHeight;

      if (window.country && (!cache.processed || cache.cachedWidth !== w || cache.cachedHeight !== h)) {
        Viz.processMapPolygons(window.country, chartW, chartH);
        cache.processed = true;
        cache.cachedWidth = w;
        cache.cachedHeight = h;
      }

      this.drawHeader(p, fixedMargin, top);
      
      const buttonY = top + 90; 
      this.drawSurfaceControls(p, fixedMargin, buttonY, cache);

      p.push();
      p.translate(chartX, chartY);
      
      let hoverNode = null;
      if (!window.country || !cache.processed) {
        p.fill(0); p.text("Map data not loaded.", 20, 20);
      } else {
        const mouseVec = p.createVector(p.mouseX - chartX, p.mouseY - chartY);
        const activeColor = this.COLORS[this.state.selectedSurface] || this.COLORS.Overall;

        p.stroke(255);
        p.strokeWeight(0.5);

        for (let c of window.country) {
          if (!c.polygons) continue;

          const countryData = cache.countryPowerIndex[c.name]; 
          const isHover = c.polygons.some(poly => pointInPoly(poly, mouseVec));
          
          let fillColor = p.color(this.COLORS.NoData);

          if (countryData && countryData.overall_match_count > 0) {
            let val = 0;
            if (this.state.selectedSurface === 'Overall') val = countryData.overall_power;
            else if (this.state.selectedSurface === 'Hard') val = countryData.Hard_power;
            else if (this.state.selectedSurface === 'Clay') val = countryData.Clay_power;
            else if (this.state.selectedSurface === 'Grass') val = countryData.Grass_power;

            const alpha = p.map(val, 0, cache.maxPower, 30, 255);
            fillColor = p.color(activeColor[0], activeColor[1], activeColor[2], alpha);

            if (isHover) {
              fillColor = p.color(activeColor[0], activeColor[1], activeColor[2], 255);
              p.stroke(50); 
              hoverNode = { ...countryData, px: p.mouseX, py: p.mouseY }; 
            }
          }

          p.fill(fillColor);
          for (let poly of c.polygons) {
            p.beginShape();
            for (let pt of poly) p.vertex(pt.x, pt.y);
            p.endShape(p.CLOSE);
          }
          if(isHover) p.stroke(255);
        }
      }
      p.pop();

      this.drawLegend(p, chartX + chartW + 20, chartY, cache);

      if (hoverNode) {
        this.drawTooltip(p, hoverNode, cache.maxPower);
      }

      if (p.mouseIsPressed && !Viz.state.prevMousePressed) {
          this.handleClicks(p);
      }
      Viz.state.prevMousePressed = p.mouseIsPressed;

      p.pop();
    },

    drawHeader: function(p, x, y) {
      p.noStroke();
      p.fill(30);
      p.textSize(20);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.TOP);
      p.text("Global Player Power Index Breakdown", x, y);
      
      p.textStyle(p.NORMAL);
      p.textSize(14);
      p.fill(80);
      p.text("Metric: Average Aces per Match (Aggressive Playstyle Indicator)", x, y + 28);
      p.textSize(12);
      p.text("Click buttons to filter by surface:", x, y + 58); 
    },

    drawSurfaceControls: function(p, x, y, cache) {
        const buttons = ['Overall', 'Hard', 'Clay', 'Grass'];
        let bx = x;
        const by = y;
        const bw = 80;
        const bh = 25;

        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);

        buttons.forEach(label => {
            const isSelected = Viz.state.selectedSurface === label;
            const baseCol = Viz.COLORS[label];
 
            if (isSelected) {
                p.stroke(0);
                p.strokeWeight(1.5);
                p.fill(baseCol[0], baseCol[1], baseCol[2]); 
            } else {
                p.stroke(200);
                p.strokeWeight(1);
                p.fill(250); 
            }

            p.rect(bx, by, bw, bh, 5);

            p.noStroke();
            p.fill(isSelected ? 255 : 50);
            p.textStyle(isSelected ? p.BOLD : p.NORMAL);
            p.text(label, bx + bw/2, by + bh/2);

            bx += bw + 10;
        });
        
        Viz.state.buttonBounds = { startX: x, startY: y, w: bw, h: bh, gap: 10, count: buttons.length, labels: buttons };
    },

    handleClicks: function(p) {
        if (!Viz.state.buttonBounds) return;
        const b = Viz.state.buttonBounds;
        const mx = p.mouseX;
        const my = p.mouseY;

        if (my >= b.startY && my <= b.startY + b.h) {
            for(let i=0; i<b.count; i++) {
                const btnX = b.startX + i * (b.w + b.gap);
                if (mx >= btnX && mx <= btnX + b.w) {
                    Viz.state.selectedSurface = b.labels[i];
                    return;
                }
            }
        }
    },

    drawLegend: function(p, x, y, cache) {
        p.push();
        p.translate(x, y);
        p.fill(0);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(14);
        p.textStyle(p.BOLD);
        p.text("Legend", 0, 0);
        
        let ly = 30;

        const barW = 15;
        const barH = 100;
        const activeColor = Viz.COLORS[Viz.state.selectedSurface];
        
        p.noStroke();
        for(let i = 0; i <= barH; i++) {
            const inter = p.map(i, 0, barH, 255, 30); 
            p.fill(activeColor[0], activeColor[1], activeColor[2], inter);
            p.rect(0, ly + i, barW, 1);
        }
        
        p.fill(60);
        p.textSize(11);
        p.textStyle(p.NORMAL);
        p.text(cache.maxPower.toFixed(1) + " Aces", barW + 8, ly); 
        p.text("0 Aces", barW + 8, ly + barH - 10); 
        
        p.push();
        p.translate(-10, ly + barH/2);
        p.rotate(-p.HALF_PI);
        p.textAlign(p.CENTER, p.TOP);
        p.text(Viz.state.selectedSurface + " Power Index", 0, 0);
        p.pop();

        ly += barH + 30;

        p.fill(Viz.COLORS.NoData);
        p.rect(0, ly, 15, 15);
        p.fill(60);
        p.textAlign(p.LEFT, p.CENTER);
        p.text("No Data", 22, ly + 7);
        
        ly += 30;
        p.fill(100);
        p.textSize(11);
        p.textAlign(p.LEFT, p.TOP);
        p.textLeading(14);
        p.text("Power Index refers to\nthe Avg Aces per match.\n\nContributed Matches:\nTotal games played by\nplayers from this\ncountry.", 0, ly);

        p.pop();
    },

    drawTooltip: function(p, node, maxGlobal) {
      const w = 240;
      const h = 170;
 
      let bx = node.px + 20;
      let by = node.py + 20;
  
      if (bx + w > 750) bx = node.px - w - 10;
      if (by + h > 500) by = node.py - h - 10;

      p.push();
      p.translate(bx, by);
  
      p.fill(255, 250); 
      p.stroke(200);
      p.strokeWeight(1);
      p.rect(0, 0, w, h, 6); 

      const padX = 15;
      let curY = 15;

      p.noStroke();
      p.fill(30);
      p.textSize(16);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.TOP);
      const displayName = node.fullName || node.name || "Unknown";
      p.text(displayName, padX, curY);

      curY += 22;
      p.fill(100);
      p.textSize(12);
      p.textStyle(p.NORMAL);
      p.text(`Matches Contributed: ${node.match_count}`, padX, curY);

      curY += 20;
      p.stroke(220);
      p.line(padX, curY, w - padX, curY);

      curY += 15;
      
      const drawRow = (label, value, color) => {
        const barX = 60;
        const barMaxW = 120;
        const barH = 12;
  
        p.noStroke();
        p.fill(80);
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(12);
        if (label === 'Overall') p.textStyle(p.BOLD);
        p.text(label, padX, curY + barH/2);
        p.textStyle(p.NORMAL);

        p.fill(240);
        p.rect(padX + barX, curY, barMaxW, barH, 2);

        const barW = p.map(value, 0, maxGlobal, 0, barMaxW);
        p.fill(color[0], color[1], color[2]);
        p.rect(padX + barX, curY, barW, barH, 2);

        p.fill(0);
        p.textAlign(p.RIGHT, p.CENTER);
        const valStr = value > 0 ? value.toFixed(1) : '-';
        p.text(valStr, w - padX, curY + barH/2);

        curY += 22;
      };

      drawRow('Hard', node.Hard_power, Viz.COLORS.Hard);
      drawRow('Clay', node.Clay_power, Viz.COLORS.Clay);
      drawRow('Grass', node.Grass_power, Viz.COLORS.Grass);
 
      curY += 5;
      drawRow('Overall', node.overall_power, Viz.COLORS.Overall);

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

          const aggregateCountry = (ioc) => {
              const fullName = Viz.IOC_TO_FULL_NAME[ioc];
              if (!fullName) return;

              groupedByCountry[fullName] = groupedByCountry[fullName] || {
                  total_aces: 0, match_count: 0,
                  HARD_aces: 0, HARD_count: 0,
                  CLAY_aces: 0, CLAY_count: 0,
                  GRASS_aces: 0, GRASS_count: 0,
                  fullName: fullName
              };

              groupedByCountry[fullName].total_aces += totalMatchAces;
              groupedByCountry[fullName].match_count++;
              groupedByCountry[fullName][surface + '_aces'] += totalMatchAces;
              groupedByCountry[fullName][surface + '_count']++;
          };

          aggregateCountry(wIOC);
          aggregateCountry(lIOC);
      }

      cache.countryPowerIndex = {};
      Object.values(groupedByCountry).forEach(d => {
          d.overall_power = d.match_count > 0 ? d.total_aces / d.match_count : 0;
          d.overall_match_count = d.match_count;

          d.Hard_power = d.HARD_count > 0 ? d.HARD_aces / d.HARD_count : 0;
          d.Clay_power = d.CLAY_count > 0 ? d.CLAY_aces / d.CLAY_count : 0;
          d.Grass_power = d.GRASS_count > 0 ? d.GRASS_aces / d.GRASS_count : 0;

          maxOverallPower = Math.max(maxOverallPower, d.overall_power, d.Hard_power, d.Clay_power, d.Grass_power);
          cache.countryPowerIndex[d.fullName] = d;
      });

      cache.maxPower = maxOverallPower || 10; 
    },

    processMapPolygons: function(countries, w, h) {
        if (!Viz._mapBounds.calculated) {
            for (let c of countries) {
                let cx = 0, cy = 0;
                for (let node of c.vertexPoint) {
                    if (!Array.isArray(node)) continue;
                    let command = node[0];
                    if (command === "m") { cx += node[1]; cy += node[2]; }
                    else if (command === "M") { cx = node[1]; cy = node[2]; }
                    else if (typeof command === 'number') { cx += node[0]; cy += node[1]; }
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
            const addPoint = (x, y) => currentPoly.push({ x: (x - minX) * scale, y: (y - minY) * scale });

            for (let node of c.vertexPoint) {
                if (!Array.isArray(node)) {
                    if (node === "z") { if (currentPoly.length > 0) c.polygons.push(currentPoly); currentPoly = []; }
                    continue;
                }
                let command = node[0];
                if (command === "m") { cx += node[1]; cy += node[2]; addPoint(cx, cy); }
                else if (command === "M") { cx = node[1]; cy = node[2]; addPoint(cx, cy); }
                else if (typeof command === 'number') { cx += node[0]; cy += node[1]; addPoint(cx, cy); }
            }
            if (currentPoly.length > 0) c.polygons.push(currentPoly);
        }
    }
  };

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

  window.Viz_RQ3_a = Viz;
})();