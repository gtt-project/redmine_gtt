class GttConfiguration
  include ActiveModel::Model

  attr_accessor :project, :geojson, :gtt_map_layer_ids, :map_rotation

  def self.for(project)
    new(
      project: project,
      geojson: project.geojson,
      map_rotation: project.map_rotation,
      gtt_map_layer_ids: project.gtt_map_layer_ids
    )
  end

  def self.from_params(params)
    new geojson: params[:geojson],
      map_rotation: params[:map_rotation],
      gtt_map_layer_ids: params[:gtt_map_layer_ids]
  end

  def map
    GttMap.new json: geojson, layers: project.gtt_map_layers.sorted, rotation: project.map_rotation
  end

end
