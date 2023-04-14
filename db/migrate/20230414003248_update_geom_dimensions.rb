class UpdateGeomDimensions < ActiveRecord::Migration[6.1]
  def up
    # Modify the geom column to include the Z dimension
    execute <<-SQL
      ALTER TABLE issues
      ALTER COLUMN geom TYPE geometry(GeometryZ, 4326)
      USING ST_Force3D(geom)
    SQL

    execute <<-SQL
      ALTER TABLE projects
      ALTER COLUMN geom TYPE geometry(GeometryZ, 4326)
      USING ST_Force3D(geom)
    SQL

    execute <<-SQL
      ALTER TABLE users
      ALTER COLUMN geom TYPE geometry(GeometryZ, 4326)
      USING ST_Force3D(geom)
    SQL
  end

  def down
    # Modify the geom column to remove the Z dimension
    execute <<-SQL
      ALTER TABLE issues
      ALTER COLUMN geom TYPE geometry(Geometry, 4326)
      USING ST_Force2D(geom)
    SQL

    execute <<-SQL
      ALTER TABLE projects
      ALTER COLUMN geom TYPE geometry(Geometry, 4326)
      USING ST_Force2D(geom)
    SQL

    execute <<-SQL
      ALTER TABLE users
      ALTER COLUMN geom TYPE geometry(Geometry, 4326)
      USING ST_Force2D(geom)
    SQL
  end
end
