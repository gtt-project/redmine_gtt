class GttMap

  attr_reader :layers, :json, :bounds, :rotation

  def initialize(geom: nil, json: nil, layers:, bounds: nil, rotation: nil)
    unless @json = json
      @json = RedmineGtt::Conversions.geom_to_json geom if geom
    end

    @rotation = rotation || 0
    @bounds = bounds || @json
    @layers = layers
  end

end
