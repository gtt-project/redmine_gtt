class UpdateGeomDimensions < ActiveRecord::Migration[5.2]
  def up
    # Modify the geom column to include the Z dimension
    Issue.transaction do
      execute <<-SQL
        ALTER TABLE issues
        ALTER COLUMN geom TYPE geometry(GeometryZ, 4326)
        USING ST_Force3D(geom)
      SQL
    end

    Project.transaction do
      execute <<-SQL
        ALTER TABLE projects
        ALTER COLUMN geom TYPE geometry(GeometryZ, 4326)
        USING ST_Force3D(geom)
      SQL
    end

    User.transaction do
      execute <<-SQL
        ALTER TABLE users
        ALTER COLUMN geom TYPE geometry(GeometryZ, 4326)
        USING ST_Force3D(geom)
      SQL
    end
  end

  def down
    # Modify the geom column to remove the Z dimension
    Issue.transaction do
      execute <<-SQL
        ALTER TABLE issues
        ALTER COLUMN geom TYPE geometry(Geometry, 4326)
        USING ST_Force2D(geom)
      SQL
    end

    Project.transaction do
      execute <<-SQL
        ALTER TABLE projects
        ALTER COLUMN geom TYPE geometry(Geometry, 4326)
        USING ST_Force2D(geom)
      SQL
    end

    User.transaction do
      execute <<-SQL
        ALTER TABLE users
        ALTER COLUMN geom TYPE geometry(Geometry, 4326)
        USING ST_Force2D(geom)
      SQL
    end
  end
end
