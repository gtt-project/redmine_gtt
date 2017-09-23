class GttMap

  attr_reader :layers, :json

  def initialize(wkb: nil, json: nil, layers:)
    unless @json = json
      @json = RedmineGtt::Conversions.wkb_to_json wkb if wkb
    end

    @layers = layers
  end

end
