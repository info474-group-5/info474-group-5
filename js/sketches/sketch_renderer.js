(function () {
    window.Renderer = {

        setData: function (manager) {
            var self = this;

            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;

            function computeLayout(data) {
                manager.data = data;
            }

            computeLayout([]);
            return Promise.resolve(manager.data);
        },

        draw: function (p, manager, ai, progress) {
            try { console.log('Renderer: delegating draw, ai=', ai); } catch (e) { }

            if (ai === 0 || ai === 1) {
                window.VizTitle.draw(p, manager, ai, progress);
                return;
            }

            // Section 2: RQ1A 
            if (ai === 2) {
                window.VizRQ1_AcesTrend.draw(p, manager, ai, progress);
                return;
            }

            // Section 3: RQ1B
            if (ai === 3) {
                window.VizRQ1_AggScatter.draw(p, manager, ai, progress);
                return;
            }

            // Section 4: RQ2A – Big 3 rankings + Slam wins
            if (ai === 4) {
                window.Viz_RQ2_RanksSlams.draw(p, manager, ai, progress);
                return;
            }

            // Section 5: RQ2B – Big 3 vs Next Gen Dashboard
            if (ai === 5) {
                window.Viz_RQ2B_Dashboard.draw(p, manager, ai, progress);
                return;
            }

            // Section 6: RQ3A (placeholder or your RQ3 viz)
            if (ai === 6) {
                // TODO: swap in your real RQ3A viz when ready
                window.Viz_RQ3_a.draw(p, manager, ai, progress);
                return;
            }

            // Section 7: RQ3B / conclusion (placeholder or your RQ3 viz)
            if (ai === 7) {
                // TODO: swap in your real RQ3B viz when ready
                window.VizBar.draw(p, manager, ai, progress);
                //window.Viz_RQ3_b.draw(p, manager, ai, progress);
                return;
            }
        }
    };
})();

