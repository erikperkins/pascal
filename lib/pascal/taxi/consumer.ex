defmodule Pascal.Taxi.Consumer do
  alias PascalWeb.Endpoint

  def handle_messages(messages) do
    for %{key: key, value: value} = message <- messages do
      Endpoint.broadcast("stream:taxi", "trip", message)

      IO.inspect message
      IO.puts "#{key}: #{value}"
    end
    :ok
  end
end
