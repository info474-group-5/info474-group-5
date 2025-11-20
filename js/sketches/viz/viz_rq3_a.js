// viz_rq3_a.js
// Visualization for RQ3: How court surfaces influence the evolution of playing style (via World Map of Grand Slam Power Index)

(function () {
    const Viz = {
    draw: function (p, manager, ai, progress) {
      p.push();

      const initialLeftOffset = 250;
      const left = manager.offsetX || initialLeftOffset;
      const top = manager.offsetY || 20;
      const totalCanvasWidth = 900;
      const w = manager.width || (totalCanvasWidth - initialLeftOffset - 20);
      const h = manager.height || 480;

      // Initialize cache
      manager._rq3a = manager._rq3a || {
        wta: null,
        slamData: null, 
        loading: true,
        powerMax: 10,           
        powerMin: 0,
      };
      const cache = manager._rq3a;

      // Define chart area
      const chartMarginTop = 80;
      const chartMarginBottom = 40;
      const chartMarginLeft = 40; 
      const chartMarginRight = 140;

      const chartW = w - chartMarginLeft - chartMarginRight;
      const chartH = h - chartMarginTop - chartMarginBottom;
      const chartX = chartMarginLeft;
      const chartY = chartMarginTop;
      
      const mapLocations = {
        'Australian Open': { 
            country: 'Australia', surface: 'Hard', 
            nx: 0.8, ny: 0.75,
            color: p.color(255, 165, 0)
        }, 
        'ROLAND GARROS': { 
            country: 'France', surface: 'Clay', 
            nx: 0.5, ny: 0.35, 
            color: p.color(188, 70, 155)
        },
        'Wimbledon': { 
            country: 'UK', surface: 'Grass', 
            nx: 0.45, ny: 0.3, 
            color: p.color(2, 131, 131)
        }, 
        'US OPEN': { 
            country: 'USA', surface: 'Hard', 
            nx: 0.2, ny: 0.4, 
            color: p.color(255, 165, 0) 
        },
      };

      // Load data if not already loading / loaded
      if (cache.loading) {
        if (cache.wta === null) {
          p.loadTable("data/raw/wta-grandslam.csv", 'csv', 'header', function (tbl) {
            cache.wta = tbl;
            cache.loading = false;
            Viz.processData(cache);
          });
        }
        p.textSize(16);
        p.fill(150);
        p.text("Loading data …", left, top + 20);
        p.pop();
        return;
      }

     
      const data = cache.slamData;
      
      if (!data || !data.length) {
          p.textSize(16);
          p.fill(20);
          p.text("No Grand Slam data available to display map.", left, top + 20);
          p.pop();
          return;
      }

      let hoverNode = null;

      // Draw Title
      p.textSize(20);
      p.fill(20);
      p.textStyle(p.BOLD);
      p.text(
        "Average Power Index (Aces per Match) at Grand Slam Locations (WTA)",
        left,
        top
      );
      p.textStyle(p.NORMAL);
      p.textSize(14);
      p.fill(90);
      p.text(
        "Node size represents the average Power Index across all years for that tournament.",
        left,
        top + 25
      );
      
      p.translate(chartX, chartY);

      p.stroke(200);
      p.fill(240);
      p.rect(0, 0, chartW, chartH);
      p.fill(150);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text("Conceptual World Map Area", chartW / 2, chartH / 2);
      p.textAlign(p.LEFT, p.TOP);
      
      const sizeMin = 10;
      const sizeMax = 50;

      for (let d of data) {
          const location = mapLocations[d.tourney_name];
          if (!location) continue;

          // Convert normalized coordinates to pixel coordinates
          const px = location.nx * chartW;
          const py = location.ny * chartH;

          // Map power to size
          const nodeSize = p.map(d.avg_power, cache.powerMin, cache.powerMax, sizeMin, sizeMax);

          // Draw node
          p.noStroke();
          p.fill(location.color);
          p.ellipse(px, py, nodeSize, nodeSize);
          
          // Draw label
          p.fill(20);
          p.textSize(12);
          p.text(d.tourney_name, px + nodeSize/2 + 5, py);
          
          // Check for hover
          const mouseXRel = p.mouseX - chartX;
          const mouseYRel = p.mouseY - chartY;
          const dist = p.dist(mouseXRel, mouseYRel, px, py);
          
          if (dist < nodeSize / 2) {
              hoverNode = { 
                  name: d.tourney_name, 
                  surface: location.surface, 
                  country: location.country,
                  avgPower: d.avg_power,
                  px: px,
                  py: py
              };
          }
      }
      
      p.pop(); 

      p.push();
      p.translate(w - chartMarginRight + 10, chartY);

      // Draw Size Legend Title
      p.fill(20);
      p.textSize(14);
      p.textAlign(p.LEFT, p.TOP);
      p.text("Avg Aces/Match (Size)", 0, 0);

      // Draw Size Legend Bubbles
      const legendX = sizeMax / 2;
      let legendY = 30;

      const levels = [cache.powerMax, (cache.powerMax + cache.powerMin) / 2, cache.powerMin];
      const sizes = [sizeMax, sizeMax - (sizeMax - sizeMin) / 2, sizeMin];

      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        const size = sizes[i];
        
        p.fill(220); // neutral color for legend
        p.ellipse(legendX, legendY + size / 2, size, size);
        p.fill(40);
        p.textSize(12);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(level.toFixed(1), legendX + sizeMax / 2 + 5, legendY + size / 2);
        legendY += size + 10;
      }
      
      // Draw Color/Surface Legend
      legendY += 10;
      p.fill(20);
      p.textSize(14);
      p.textAlign(p.LEFT, p.TOP);
      p.text("Surface (Color)", 0, legendY);
      legendY += 20;

      for (let key in mapLocations) {
          const loc = mapLocations[key];
          p.fill(loc.color);
          p.rect(0, legendY, 15, 15);
          p.fill(40);
          p.textSize(12);
          p.text(loc.surface, 20, legendY);
          legendY += 20;
      }

      p.pop(); 
      
      if (hoverNode) {
        p.push();
        // Translate to the hover position within the chart, then adjust for canvas origin
        const tooltipX = chartX + hoverNode.px;
        const tooltipY = chartY + hoverNode.py;
        
        const lines = [
            `${hoverNode.name} (${hoverNode.country})`,
            `Surface: ${hoverNode.surface}`,
            `Avg Aces: ${hoverNode.avgPower.toFixed(2)}`
        ];
        
        // Find dimensions
        p.textSize(12);
        const padding = 6;
        let tw = 0;
        for (let line of lines) {
            tw = Math.max(tw, p.textWidth(line));
        }
        const th = 15 * lines.length;
        
        let tx = tooltipX + 10;
        let ty = tooltipY - th - padding;
        
        // Adjust if tooltip goes off screen (right)
        const screenW = w;
        if (tx + tw + 2 * padding > screenW) {
             // Move to the left of the cursor
            tx = tooltipX - tw - 2 * padding - 10;
        }

        // Tooltip box
        p.fill(255, 250);
        p.stroke(150);
        p.rect(tx, ty, tw + 2 * padding, th + 2 * padding, 4);

        // Tooltip text
        p.noStroke();
        p.fill(40);
        p.textAlign(p.LEFT, p.TOP);
        let currentY = ty + padding;
        for (let i = 0; i < lines.length; i++) {
          if (i === 0) {
            p.textStyle(p.BOLD);
          } else {
            p.textStyle(p.NORMAL);
          }
          p.text(lines[i], tx + padding, currentY);
          currentY += 15;
        }
        p.pop();
      }

      p.pop();
    },

    processData: function (cache) {
      // Data Processing Logic

      let combinedData = [];
      const grandSlams = new Set(['AUSTRALIAN OPEN', 'ROLAND GARROS', 'WIMBLEDON', 'US OPEN']);
      
      const wtaTable = cache.wta;
      for (let i = 0; i < wtaTable.getRowCount(); i++) {
        const row = wtaTable.getRow(i);
        const tourneyName = row.getString('tourney_name').trim().toUpperCase();;
        const wAceStr = row.getString('w_ace').trim();
        const lAceStr = row.getString('l_ace').trim();

        const wAce = (wAceStr === 'NA') ? NaN : parseFloat(wAceStr);
        const lAce = (lAceStr === 'NA') ? NaN : parseFloat(lAceStr);

        if (grandSlams.has(tourneyName) && !isNaN(wAce) && !isNaN(lAce)) {
          const totalAces = wAce + lAce;
          
          combinedData.push({
            tourney_name: tourneyName,
            power: totalAces,
          });
        }
      }

      const aggregatedData = {}; 
      let totalMaxPower = 0;

      for (const d of combinedData) {
          const key = d.tourney_name;
          aggregatedData[key] = aggregatedData[key] || { total_power: 0, count: 0, tourney_name: key };
          aggregatedData[key].total_power += d.power;
          aggregatedData[key].count += 1;
      }

      cache.slamData = Object.values(aggregatedData).map(d => {
          d.avg_power = d.total_power / d.count;
          totalMaxPower = Math.max(totalMaxPower, d.avg_power);
          return d;
      });

      // Set power scale
      cache.powerMin = 0;
      // Use a fixed max or a slight buffer above the max found for the scale
      cache.powerMax = Math.max(10, totalMaxPower * 1.1); 
    },
    
    // Placeholder function
    handleClick: function (p) {
        // No click handling needed for the map
    },
  };
  window.Viz_RQ3_a = Viz;
})();