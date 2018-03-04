class GttConfiguration
  include ActiveModel::Model

  attr_accessor :project, :geojson, :gtt_tile_source_ids

  def self.for(project)
    new(
      project: project,
      geojson: project.geojson,
      gtt_tile_source_ids: project.gtt_tile_source_ids
    )
  end

  def self.from_params(params)
    new geojson: params[:geojson],
      gtt_tile_source_ids: params[:gtt_tile_source_ids]
  end

  def map
    GttMap.new json: geojson, layers: project.gtt_tile_sources.sorted
  end

end
