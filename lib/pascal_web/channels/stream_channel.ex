defmodule PascalWeb.StreamChannel do
  use Phoenix.Channel

  def join("stream:taxi", _message, socket) do
    {:ok, socket}
  end

  def handle_in("trip", %{"body" => body}, socket) do
    broadcast!(socket, "trip", %{body: body})
  end
end
