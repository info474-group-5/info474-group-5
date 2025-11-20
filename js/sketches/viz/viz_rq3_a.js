(function () {
    const Viz = {
    draw: function (p, manager, ai, progress) {
      p.push();

      const left = manager.offsetX || 20;
      const top = manager.offsetY || 20;
      const w = manager.width || 760;
      const h = manager.height || 480;

      // Initialize cache
      manager._rq3a = manager._rq3a || {
        atp: null,
        wta: null,
        combined: null,
        surfaces: null,
        years: null,
        selectedSurface: null,
        selectedYear: null,
        loading: true,
      };
      const cache = manager._rq3a;

      // Load data if not already loading / loaded
      if (cache.loading) {
        // Kick off loading both tables
        if (cache.atp === null) {
          p.loadTable("data/raw/atp_matches.csv", 'csv', 'header', function (tbl) {
            maybeProcess();
          });
        }
        if (cache.wta === null) {
          p.loadTable("data/raw/wta-grandslam.csv", 'csv', 'header', function (tbl) {
            maybeProcess();
          });
        }

        // Check if both loaded
        function maybeProcess() {
          if (cache.atp && cache.wta) {
            const combined = [];
            function process(table) {
              for (let r = 0; r < table.getRowCount(); r++) {
                const year = parseInt(table.getString(r, 'year'));
                const surface = table.getString(r, 'surface');
                const power = parseFloat(table.getString(r, 'power_index'));
                if (surface && !isNaN(year) && !isNaN(power)) {
                  combined.push({ year, surface, power });
                }
              }
            }
            process(cache.atp);
            process(cache.wta);

            cache.combined = combined;
            cache.surfaces = [...new Set(combined.map(d => d.surface))];
            cache.years = [...new Set(combined.map(d => d.year))].sort((a, b) => a - b);
            cache.selectedSurface = cache.surfaces[0];
            cache.selectedYear = cache.years[0];
            cache.loading = false;
          }
        }

        // Show loading text
        p.fill(50);
        p.textSize(18);
        p.text("Loading data …", left, top + 20);
        p.pop();
        return;
      }

      // Once loaded, we have cache.combined, cache.surfaces, cache.years
      // For demo: change year every few seconds
      if (p.frameCount % 120 === 0) {
        const idx = cache.years.indexOf(cache.selectedYear);
        cache.selectedYear = cache.years[(idx + 1) % cache.years.length];
      }

      // Compute average power index for selected surface/year
      const filtered = cache.combined.filter(d =>
        d.surface === cache.selectedSurface && d.year === cache.selectedYear
      );
      let avgPower = 0;
      if (filtered.length > 0) {
        avgPower = filtered.reduce((sum, d) => sum + d.power, 0) / filtered.length;
      }

      // Draw UI
      p.textSize(20);
      p.fill(20);
      p.text(
        `Average Power Index — ${cache.selectedSurface}, ${cache.selectedYear}`,
        left,
        top
      );

      // Draw bar
      const barX = left;
      const barY = top + 50;
      const barH = 40;
      const maxBarWidth = w - 2 * left;
      // scale avgPower to bar, assume power index is in a known reasonable range
      const barW = p.constrain(avgPower * 6, 0, maxBarWidth);

      p.fill(100, 160, 240);
      p.rect(barX, barY, barW, barH, 5);

      p.fill(0);
      p.textSize(16);
      p.text(`Value: ${avgPower.toFixed(2)}`, barX + 5, barY + barH + 25);

      p.pop();
    }
  };
  window.Viz_RQ3_a = Viz;
 })();