class GttMap

  attr_reader :layers, :json, :bounds

  def initialize(wkb: nil, json: nil, layers:, bounds: nil)
    unless @json = json
      @json = RedmineGtt::Conversions.wkb_to_json wkb if wkb
    end

    @bounds = bounds || @json
    @layers = layers
  end

end
