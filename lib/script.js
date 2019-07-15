"use strict";

(function () {
  d3.selection.prototype.show = function () {
    this.style('display', 'block');
    return this;
  };

  d3.selection.prototype.showFlex = function () {
    this.style('display', 'flex').style('display', '-webkit-flex');
    return this;
  };

  d3.selection.prototype.hide = function () {
    this.style('display', 'none');
    return this;
  };

  d3.selection.prototype.toggle = function () {
    var isHidden = this.style('display') == 'none';
    this.style('display', isHidden ? 'inherit' : 'none');
    return this;
  };

  d3.selection.prototype.hideToggle = function () {
    var isHidden = this.style('display') == 'none';
    this.style('display', isHidden ? null : 'none');
    return this;
  };

  d3.selection.prototype.check = function () {
    this.property("checked", true);
    this.attr("checked", true);
    return this;
  };

  d3.selection.prototype.uncheck = function () {
    this.property("checked", false);
    this.attr("checked", false);
    return this;
  };

  var toolDiv = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
  var selection = document.getElementById("state-selector");
  selection.addEventListener("change", function (e) {
    if (e.target.value !== 'default') {
      document.querySelector(".state-" + String(e.target.value.replace(/ /g, ''))).dispatchEvent(new CustomEvent('click'));
    } else {
      d3.selectAll('path').style("fill-opacity", function (d) {
        return 1;
      });
      d3.select(".state-info-container").select("h2").text("Select a state");
      d3.select(".mobile-select-header").show();
      d3.select(".state-info-container").hide();
      d3.select("#state-selector").selectAll("option").attr("selected", null);
      d3.select("#state-selector").select("option[value='default']").attr("selected", true);
      d3.select(".full-state-info").select(".main-text").selectAll("li").remove();
      d3.select(".full-state-info").hide();
      d3.select(".billing-type").hide();
      d3.select(".notes-container").hide();
    }
  });
  d3.queue().defer(d3.json, 'https://script.google.com/macros/s/AKfycbxDrfsw_F5TfPYl8KZJOGGskQnRJSYSsOE2YUsmGDV3PE-yFPlk/exec?id=1Emks_kAXoj0U8nBQME7X16aP5IyCBDDZGFtewNI70LI').defer(d3.json, 'data/states-abrev.json').await(checkSize);
  var cachedWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    var newWidth = window.innerWidth;

    if (newWidth !== cachedWidth) {
      cachedWidth = newWidth;
      checkSize();
    }
  });
  window.addEventListener('orientationchange', checkSize);
  var data;
  var abrev;
  var firstTime = true;
  var mobile = false;

  function checkSize(error, dataFull, abrevFull) {
    if (firstTime) {
      data = dataFull;
      abrev = abrevFull;
      firstTime = false;
    }

    if (screen.width <= 768 || window.innerWidth <= 768) {
      mobile = true;
    } else {
      mobile = false;
    }

    var url = new URLSearchParams(window.location.search);
    var urlState = url.get("state");
    var firstState;

    if (urlState) {
      if (abrev[urlState.toUpperCase()]) {
        firstState = abrev[urlState.toUpperCase()].split(' ').map(function (s) {
          return s.charAt(0).toUpperCase() + s.substring(1);
        }).join('');
      } else if (Object.values(abrev).map(function (val) {
        return val.toLowerCase();
      }).indexOf(urlState.toLowerCase()) > -1) {
        firstState = urlState.toLowerCase().split(' ').map(function (s) {
          return s.charAt(0).toUpperCase() + s.substring(1);
        }).join('');
      }
    }

    renderMap(firstState);
  }

  function renderMap(firstState) {
    var width = 500;
    var height = 350;
    var scale = 700;
    var clicked = false;
    var clickedState = "Default";

    if (mobile) {
      d3.select(".graph-top-container").style("flex-direction", "column");
      d3.select(".selection-container").show();
      d3.select(".initial-main-text").hide();
      d3.select(".state-info-container").select("h2").text("");
      width = parseInt(d3.select(".body-container").style("width")) - 40;
      height = width - 50;

      if ((screen.width <= 768 || window.innerWidth <= 768) && (screen.width >= 600 || window.innerWidth >= 600)) {
        height = width - 200;
      }

      scale = width + 100;
    }

    var projection = d3.geo.albersUsa().translate([width / 2, height / 2]).scale([scale]);
    var path = d3.geo.path().projection(projection);
    var color = d3.scale.linear();
    color.domain([0, 1, 2]).range(["#e5e5e5", "#93d7d6", "#49bdba"]);
    d3.select(".the-us-map").remove();
    var svg = d3.select(".state-viz").append("svg").attr("class", "the-us-map").attr("width", width).attr("height", height).on("click", function () {
      if (clicked) {
        d3.selectAll('path').style("fill-opacity", function (d) {
          return 1;
        });
        clicked = false;
        resetToDefault();
      }
    });
    d3.json("data/us-states.json", function (json) {
      for (var i = 0; i < data.length; i++) {
        var dataState = data[i]["State"];
        var dataValue = data[i]["Comprehensive/Partial"] === "Comprehensive" ? 2 : 1;
        var dataMain = data[i]["Main_text"];
        var dataNotes = data[i]["Footnote_text"];

        for (var j = 0; j < json.features.length; j++) {
          var jsonState = json.features[j].properties.name;

          if (abrev[dataState] == jsonState) {
            json.features[j].properties.action = dataValue;
            json.features[j].properties.main = dataMain;
            json.features[j].properties.notes = dataNotes;
            break;
          }
        }
      }

      var paths = svg.selectAll("path").data(json.features);
      paths.exit().remove();
      paths.enter().append("path").attr("d", path).attr("class", function (d) {
        return "state-" + String(d.properties.name.replace(/ /g, ''));
      }).style("stroke", "#fff").style("stroke-width", "1").on("mouseover", function (d) {
        if (!clicked) d3.select(this).style("fill-opacity", 0.7);
      }).on("mouseout", function (d) {
        if (!clicked) d3.select(this).style("fill-opacity", 1);
      }).on("click", stateClicked);
      paths.style("fill", function (d) {
        return color(d.properties.action || 0);
      });
      d3.select(".legend").remove();
      var legend = d3.select(".state-legend").append("svg").attr("class", "legend").attr("width", 350).attr("height", mobile ? 100 : 150).selectAll("g").data(color.domain().slice()).enter().append("g").attr("transform", function (d, i) {
        return "translate(0," + i * 25 + ")";
      }).on("mouseover", legendMouseover).on("mouseout", legendMouseout);
      legend.append("circle").attr("cx", 9).attr("cy", 9).attr("r", 8).style("fill", color);
      legend.append("text").data(["No Balance Billing Protections", "Partial Balance Billing Protections", "Comprehensive Balance Billing Protections"]).attr("x", 24).attr("y", 9).attr("dy", ".35em").style("font-size", function (d) {
        if (mobile) return 16;else return 14;
      }).text(function (d) {
        return d;
      });

      if (firstState) {
        document.querySelector(".state-" + String(firstState)).dispatchEvent(new CustomEvent('click'));
      }
    });

    function stateClicked(d) {
      if (clicked && clickedState === d.properties.name) {
        resetToDefault();
        return;
      }

      svg.selectAll("path").style("fill-opacity", function (d) {
        return 0.3;
      });
      d3.select(this).style("fill-opacity", function (d) {
        return 1;
      });

      if (mobile) {
        d3.select(".mobile-select-header").hide();
        d3.select(".state-info-container").show();
        d3.select("#state-selector").select("option[value=\"" + String(d.properties.name) + "\"]").attr("selected", true);
      }

      clicked = true;
      clickedState = d.properties.name;
      d3.select(".state-info-container").select("h2").text(d.properties.name);
      showMainInfo(d);
      showNotes(d);
      d3.event.stopPropagation();
    }

    function showMainInfo(d) {
      var billingText = "No Balance Billing Protections";
      d3.selectAll(".initial-main-text").hide();

      if (d.properties.action) {
        d3.select(".full-state-info").select(".main-text").selectAll("li").remove();

        if (d.properties.action === 2) {
          d3.select(".billing-type").text("Comprehensive Balance Billing Protections").classed('color-comp', true).classed('color-partial', false).classed('color-none', false);
        } else {
          d3.select(".billing-type").text("Partial Balance Billing Protections").classed('color-comp', false).classed('color-partial', true).classed('color-none', false);
        }

        var mainText = d.properties.main.trim().split('\n');
        mainText.forEach(function (main) {
          if (main[0] === "-") {
            d3.select(".full-state-info").select(".main-text").append("li").attr('class', 'non-bulleted').text(main.slice(2));
          } else {
            d3.select(".full-state-info").select(".main-text").append("li").attr('class', 'bulleted').text(main);
          }
        });
        d3.select(".full-state-info").show();
      } else {
        d3.select(".full-state-info").hide();
        d3.select(".billing-type").text(billingText).classed('color-comp', false).classed('color-partial', false).classed('color-none', true);
      }

      d3.select(".billing-type").show();
    }

    function showNotes(d) {
      d3.select(".notes-container").show();

      if (d.properties.action) {
        d3.select(".inner-notes").select(".the-notes").selectAll("p").remove();
        var notes = d.properties.notes.trim().split('\n');
        notes.forEach(function (note) {
          d3.select(".inner-notes").select(".the-notes").append("p").text(note);
        });
        d3.select(".inner-notes").show();
      } else {
        d3.select(".inner-notes").hide();
      }
    }

    function legendMouseover(d) {
      var action = d;
      d3.select(".the-us-map").selectAll("path").style("fill-opacity", function (d) {
        if (action === 0 && !d.properties.action) {
          return 1;
        } else if (action === 0 && d.properties.action) {
          return 0.2;
        }

        if (action != d.properties.action) {
          return 0.2;
        }

        return 1;
      });
    }

    function legendMouseout() {
      d3.select(".the-us-map").selectAll("path").style("fill-opacity", 1);
    }

    function resetToDefault() {
      d3.select(".state-info-container").select("h2").text("Select a state");

      if (mobile) {
        d3.select(".mobile-select-header").show();
        d3.select(".state-info-container").hide();
        d3.select("#state-selector").selectAll("option").attr("selected", null);
        d3.select("#state-selector").select("option[value='default']").attr("selected", true);
      } else {
        d3.selectAll(".initial-main-text").show();
        d3.select(".state-info-container").select("h2").text("Select a state");
      }

      d3.select(".full-state-info").select(".main-text").selectAll("li").remove();
      d3.select(".full-state-info").hide();
      d3.select(".billing-type").hide();
      d3.select(".notes-container").hide();
    }
  }
})();