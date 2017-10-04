class EnsureProperSrid < ActiveRecord::Migration
  def up
    execute "SELECT UpdateGeometrySRID('issues','geom',4326)"
    execute "SELECT UpdateGeometrySRID('projects','geom',4326)"
    execute "SELECT UpdateGeometrySRID('users','geom',4326)"
  end
end
