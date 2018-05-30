# frozen_string_literal: true

module RedmineGtt
  class SpatialProjectsQuery
    def initialize(contains: nil, projects: Project.active.visible, geometry: true)
      @contains = contains.presence
      @projects = projects
      @include_geometry = geometry
    end

    QUERY_SQL = <<-SQL
      #{Project.table_name}.geom IS NOT NULL AND
      ST_Intersects(#{Project.table_name}.geom, ST_GeomFromText('%s', 4326))
    SQL

    VIRTUAL_GEOJSON_ATTRIBUTE_SELECT = <<-SQL
      #{Project.table_name}.*, #{Project.geojson_attribute_select}
    SQL

    def count
      # we have to pass :all, otherwise we hit this rails issue due to the
      # select call in build_scope: https://github.com/rails/rails/issues/15138
      scope.count :all
    end

    def scope
      @scope ||= build_scope
    end

    private

    def build_scope
      if @contains
        @projects = @projects.where(
          Project.send(:sanitize_sql_array, [ QUERY_SQL, @contains ])
        )
      end
      if @include_geometry
        @projects = @projects.select VIRTUAL_GEOJSON_ATTRIBUTE_SELECT
      end
      @projects
    end

  end
end
