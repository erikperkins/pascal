import d3 from "../vendor/d3.min.js"
import {Socket} from "phoenix"

let d3socket = new Socket("/socket", {params: {token: window.userToken}})
d3socket.connect()
let d3channel = d3socket.channel("stream:taxi", {})

let messagesContainer = document.querySelector("#messages")

fetch("json/nyc_taxi_zones.geojson")
  .then(response => response.json())
  .then(json => {
    function display(message) {
      let row = document.createElement("div")

      let html = document.createElement("div")
      html.setAttribute("class", "grid grid-cols-4 py-2 font-semibold text-sm text-center")

      row.appendChild(html)

      let predicted = document.createElement("div")
      predicted.setAttribute("style", "color: lightcoral")
      predicted.textContent = `\$${message.predicted_tip.toFixed(2)}`
      html.appendChild(predicted)

      let actual = document.createElement("div")
      actual.setAttribute("style", "color: mediumseagreen")
      actual.textContent = `\$${message.tip_amount.toFixed(2)}`
      html.appendChild(actual)

      let pickup = document.createElement("div")
      pickup.setAttribute("style", "color: royalblue")
      pickup.textContent = `${locations[message.pickup_location_id]?.zone}`
      html.appendChild(pickup)

      let dropoff = document.createElement("div")
      dropoff.setAttribute("style", "color: orange")
      dropoff.textContent = `${locations[message.dropoff_location_id]?.zone}`
      html.appendChild(dropoff)

      let percent_difference = Math.abs(message.predicted_tip - message.tip_amount) / (message.tip_amount + 0.01)

      if (percent_difference > 0.15) {
        console.log('Bad prediction!')
        html.setAttribute("style", "background-color: lavenderblush;")
      }

      return row.innerHTML
    }


    const chartWidth = 800
    const chartHeight = 600
    const backgroundColor = "aliceblue"
    const landColor = "linen"
    const landStroke = "gray"

    const projection = d3.geoMercator()
      .scale(80000)
      .center([-74.05, 40.78])
      .translate([chartWidth / 3, chartHeight / 3])

    const pathGenerator = d3.geoPath(projection)

    const svg = d3.select('#map')

    svg.append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr('fill', backgroundColor)

    svg.selectAll('path')
      .data(json.features)
      .join('path')
      .attr('d', pathGenerator)
      .attr('id', d => `zone-${d.properties.location_id}`)
      .attr('fill', landColor)
      .attr('stroke', landStroke)
      .attr('stroke-width', 1)

    let locations = {}
    json.features.forEach(feature => {
      locations[feature.properties.location_id] = {
        'zone': feature.properties.zone,
        'centroid': pathGenerator.centroid(feature),
      }
    })

    var trips = []
    var trip_id = 0

    d3channel.on("trip", payload => {
      trip_id += 1
      payload.trip_id = trip_id

      trips.push(payload)
      trips = trips.slice(Math.max(trips.length - 5, 0))

      let rows = d3.select("#messages").selectAll("row").data(trips, d => d?.trip_id)
      rows.enter().append("row").html(d => display(d))
      rows.exit().remove()

      let datum = {
        'trip_id': payload.trip_id,
        'pickup': locations[payload.pickup_location_id]?.centroid,
        'dropoff': locations[payload.dropoff_location_id]?.centroid
      }

      let lines = svg.selectAll('.trip').data([datum], d => d?.trip_id)

      let interval = 500

      lines.enter().append('path')
        .attr('class', 'trip')
        .attr('d', d => 'M' + d.pickup + 'L' + d.pickup)
        .attr('stroke', 'royalblue')
        .attr('stroke-width', 4)
        .attr('opacity', 0.5)
        .transition()
        .duration(2 * interval)
        .attr('d', d => 'M' + d.pickup + 'L' + d.dropoff)
        .transition()
        .duration(2 * interval)
        .attr('d', d => 'M' + d.dropoff  + 'L' + d.dropoff)
        .attr('stroke', 'orange')

      lines.exit()
        .transition()
        .delay(4 * interval)
        .attr("opacity", 0)
        .attr('stroke', landColor)
        .remove()

      d3.select(`#zone-${payload['pickup_location_id']}`)
        .transition()
        .duration(interval)
        .attr('fill', 'royalblue')
        .transition()
        .duration(interval)
        .delay(2  * interval)
        .attr('fill', landColor)

      d3.select(`#zone-${payload['dropoff_location_id']}`)
        .transition()
        .duration(interval)
        .delay(interval)
        .attr('fill', 'orange')
        .transition()
        .duration(interval)
        .delay(interval)
        .attr('fill', landColor)
    })

    d3channel.join()
      .receive("ok", resp => { console.log("Joined successfully", resp) })
      .receive("error", resp => { console.log("Unable to join", resp) })
  })

