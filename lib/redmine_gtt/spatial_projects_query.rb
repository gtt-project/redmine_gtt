module RedmineGtt
  class SpatialProjectsQuery
    def initialize(contains: nil, projects: Project.active.visible)
      @contains = contains.presence
      @projects = projects
    end

    QUERY_SQL = (<<-SQL
      #{Project.table_name}.geom IS NOT NULL AND
      ST_Intersects(#{Project.table_name}.geom, ST_GeomFromText('%s', 4326))
    SQL
                ).freeze

    def scope
      if @contains
        @projects = @projects.where(
          Project.send(:sanitize_sql_array, [ QUERY_SQL, @contains ])
        )
      end
      @projects
    end

  end
end
