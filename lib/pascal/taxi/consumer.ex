defmodule Pascal.Taxi.Consumer do
  alias PascalWeb.Endpoint

  def handle_messages(messages) do
    for %{key: key, value: value} = _message <- messages do
      {:ok, json} = Jason.decode(value)

      Endpoint.broadcast("stream:taxi", "trip", json)
      IO.puts "#{key}: #{value}"
    end
    :ok
  end
end
