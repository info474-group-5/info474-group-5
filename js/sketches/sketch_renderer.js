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

            // Section 2: RQ3A
            if (ai === 2) {
                window.Viz_RQ3_a.draw(p, manager, ai, progress);
                return;
            }   
            
            // Section 3: RQ3B
            if (ai === 3) {
                window.Viz_rq3_b.draw(p, manager, ai, progress);
                return;
            }

            
            if (ai === 4) {
                // Place holder visualization because actual RQ3_B isn't rendering
                window.VizRQ1_AggScatter.draw(p, manager, ai, progress);
                return;
            }

            // Section 4: RQ1
            if (ai === 5) {
                // Place holder for picture
                return;
            }

            // Section 5: RQ1_A
            if (ai === 6) {
                window.VizRQ1_AcesTrend.draw(p, manager, ai, progress);
                return;
            }

            // Section 6: RQ1_B
            if (ai === 7) {
                window.VizRQ1_AggScatter.draw(p, manager, ai, progress);
                return;
            }

            // Section 7: RQ2
            if (ai === 8) {
                return;
            }

            // Section 8: RQ2_A Rankings & Slam Trajectories
            if (ai === 9) {
                window.Viz_RQ2_RanksSlams.draw(p, manager, ai, progress);
                return;
            }

            // Section 9: RQ2_B Player Dashboard
            if (ai === 10) {
                window.Viz_RQ2B_Dashboard.draw(p, manager, ai, progress);
                return;
            }

            // Section 10: Conclusion
            if (ai === 11) {
                window.VizBar.draw(p, manager, ai, progress);
                return;
            }
        }
    };
})();

