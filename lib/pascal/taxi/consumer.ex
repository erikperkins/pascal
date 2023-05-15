defmodule Pascal.Taxi.Consumer do
  alias PascalWeb.Endpoint

  def handle_messages(messages) do
    for %{key: _key, value: value} = _message <- messages do
      case Jason.decode(value) do
        {:ok, json} -> Endpoint.broadcast("stream:taxi", "trip", json)
        {:error, _} -> IO.puts "Error decoding JSON"
      end
    end
    :ok
  end
end
