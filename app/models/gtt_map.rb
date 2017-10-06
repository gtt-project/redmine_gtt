class GttMap

  attr_reader :layers, :json, :bounds

  def initialize(geom: nil, json: nil, layers:, bounds: nil)
    unless @json = json
      @json = RedmineGtt::Conversions.geom_to_json geom if geom
    end

    @bounds = bounds || @json
    @layers = layers
  end

end
