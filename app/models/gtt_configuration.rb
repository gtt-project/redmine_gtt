class GttConfiguration
  include ActiveModel::Model

  attr_accessor :project, :gtt_tile_source_ids

  def self.for(project)
    new project: project
  end

  def gtt_tile_source_ids
    project.gtt_tile_source_ids
  end

  def gtt_tile_source_ids=(ids)
    project.gtt_tile_source_ids = ids
  end
end
