class EnsureProperSrid < ActiveRecord::Migration[5.2]
  def up
    Issue.transaction do
      execute "SELECT UpdateGeometrySRID('issues','geom',4326)"
    end
    Project.transaction do
      execute "SELECT UpdateGeometrySRID('projects','geom',4326)"
    end
    User.transaction do
      execute "SELECT UpdateGeometrySRID('users','geom',4326)"
    end
  end
end
