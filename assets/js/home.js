import d3 from "../vendor/d3.min.js"
import {Socket} from "phoenix"

let d3socket = new Socket("/socket", {params: {token: window.userToken}})
d3socket.connect()
let d3channel = d3socket.channel("stream:taxi", {})

let messagesContainer = document.querySelector("#messages")

fetch("json/nyc_taxi_zones.geojson")
  .then(response => response.json())
  .then(json => {
    let locations = {}
    json.features.forEach(item => locations[item.properties.location_id] = item.properties.zone)

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

    let centroids = json.features.map(feature => pathGenerator.centroid(feature))

    d3.selectAll(".centroid").data(centroids)
      .enter().append("circle")
      .attr("class", "centroid")
      .attr("fill", "black")
      .attr("r", 50)
      .attr("cx", d => d[0])
      .attr("cy", d => d[1])

    d3channel.on("trip", payload => {
      let messageItem = document.createElement("p")
      messageItem.innerText = `Tip: \$${payload["tip_amount"]}, Pickup: ${locations[payload["pickup_location_id"]]}, Dropoff: ${locations[payload["dropoff_location_id"]]}`
      messagesContainer.appendChild(messageItem)

      let children = Array.from(messagesContainer.children)
      let tail = children.slice(Math.max(children.length - 5, 0))

      messagesContainer.replaceChildren(...tail)

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

