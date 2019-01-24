# This must actually run for Redmine migration already
class CreateSchema < ActiveRecord::Migration[5.2]
  def up
    # execute "CREATE SCHEMA IF NOT EXISTS app"
    # execute "CREATE SCHEMA IF NOT EXISTS dev"
  end

  def down
    # execute "DROP SCHEMA app"
    # execute "DROP SCHEMA dev"
  end
end
