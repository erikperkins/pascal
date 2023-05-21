defmodule PascalWeb.PageController do
  use PascalWeb, :controller

  def home(conn, _params) do
    # The home page is often custom made,
    # so skip the default app layout.
    render(conn, :home)
  end

  def taxi(conn, _params) do
    render(conn, :taxi)
  end

  def admin(conn, _params) do
    render(conn, :admin)
  end

  def exception(conn, _params) do
    _value = 1 / 0
    render(conn, :error)
  end

  def error(conn, _params) do
    try do
      _value = 1 / 0
    rescue
      exception ->
        Sentry.capture_exception(exception, [stacktrace: __STACKTRACE__, extra: %{extra: "Division by zero"}])
    end
    render(conn, :error)
  end

  def message(conn, _params) do
    Sentry.capture_message("Hello, Sentry!")
    render(conn, :home)
  end
end
