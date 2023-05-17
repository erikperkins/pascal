import d3 from "../vendor/d3.min.js"
import {Socket} from "phoenix"

let d3socket = new Socket("/socket", {params: {token: window.userToken}})
d3socket.connect()
let d3channel = d3socket.channel("stream:taxi", {})

let messagesContainer = document.querySelector("#messages")

fetch("json/nyc_taxi_zones.geojson")
  .then(response => response.json())
  .then(json => {

    const chartWidth = 800
    const chartHeight = 600
    const backgroundColor = "aliceblue"
    const landColor = "linen"
    const landStroke = "gray"

    const projection = d3.geoMercator()
      .scale(60000)
      .center([-74.1, 40.78])
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

    let tripContainer = []

    d3channel.on("trip", payload => {
      let messageItem = document.createElement("tr")

      let predicted = document.createElement("td")
      predicted.innerText = `Predicted tip: \$${payload.predicted_tip.toFixed(2)}`
      messageItem.appendChild(predicted)

      let actual = document.createElement("td")
      actual.innerText = `Actual tip: \$${payload.tip_amount.toFixed(2)}`
      messageItem.appendChild(actual)

      let pickup = document.createElement("td")
      pickup.style.cssText = "color:royalblue;"
      pickup.innerText = `Pickup: ${locations[payload.pickup_location_id]?.zone}`
      messageItem.appendChild(pickup)

      let dropoff = document.createElement("td")
      dropoff.style.cssText = "color:orange;"
      dropoff.innerText = `Dropoff: ${locations[payload.dropoff_location_id]?.zone}`
      messageItem.appendChild(dropoff)

      messagesContainer.appendChild(messageItem)

      let children = Array.from(messagesContainer.children)
      let tail = children.slice(Math.max(children.length - 5, 0))

      messagesContainer.replaceChildren(...tail)


      let datum = {
        'pickup': locations[payload.pickup_location_id]?.centroid,
        'dropoff': locations[payload.dropoff_location_id]?.centroid
      }

      tripContainer.push(datum)
      let trips = tripContainer.slice(Math.max(tripContainer.length - 5, 0))

//      let lines = svg.selectAll('.trip').data(trips)
//      lines.attr('class', 'trip')
//        .attr('d', d => 'M' + d.pickup + 'L' + d.dropoff)
//        .attr('stroke', 'firebrick')
//        .attr('stroke-width', 2)

//        .attr('opacity', 0)
//        .transition()
//        .duration(500)
//        .attr('opacity', 1)
//        .transition()
//        .delay(1000)
//        .duration(500)
//        .attr('opacity', 0)

//      lines.enter().append('path')
//        .attr('class', 'trip')
//        .attr('d', d => 'M' + d.pickup + 'L' + d.dropoff)
//        .attr('stroke', 'firebrick')
//        .attr('stroke-width', 2)

//        .attr('opacity', 0)
//        .transition()
//        .duration(500)
//        .attr('opacity', 1)
//        .transition()
//        .delay(1000)
//        .duration(500)
//        .attr('opacity', 0)

//        .attr('stroke-dasharray', d => Math.sqrt( (d.pickup[0] - d.dropoff[0])**2 + (d.pickup[1] - d.dropoff[1])**2))
//        .attr('stroke-dashoffset', d => Math.sqrt( (d.pickup[0] - d.dropoff[0])**2 + (d.pickup[1] - d.dropoff[1])**2))
//        .transition()
//        .duration(500)
//        .attr('stroke-dashoffset', 0)
//        .transition()
//        .duration(500)
//        .delay(1000)

//      lines.exit()
//        .remove()

      d3.select(`#zone-${payload['pickup_location_id']}`)
        .transition()
        .duration(500)
        .attr('fill', 'royalblue')
        .transition()
        .duration(500)
        .delay(1000)
        .attr('fill', landColor)

      d3.select(`#zone-${payload['dropoff_location_id']}`)
        .transition()
        .duration(500)
        .attr('fill', 'orange')
        .transition()
        .duration(500)
        .delay(1000)
        .attr('fill', landColor)
    })

    d3channel.join()
      .receive("ok", resp => { console.log("Joined successfully", resp) })
      .receive("error", resp => { console.log("Unable to join", resp) })
  })

