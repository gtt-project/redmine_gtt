class GttTileSourcesController < ApplicationController
  layout 'admin'

  before_action :require_admin

  self.main_menu = false

  def index
    @tile_sources = GttTileSource.order name: :asc
  end

  def new
    @tile_source = GttTileSource.new_for_type tile_source_params[:type]
  end

  def create
    r = RedmineGtt::Actions::CreateTileSource.(tile_source_params)
    if r.tile_source_created?
      redirect_to gtt_tile_sources_path
    else
      @tile_source = r.tile_source
      render 'new'
    end
  end

  def edit
    @tile_source = GttTileSource.find params[:id]
  end

  def update
    ts = GttTileSource.find params[:id]
    r = RedmineGtt::Actions::UpdateTileSource.(ts, tile_source_params)
    if r.tile_source_updated?
      redirect_to gtt_tile_sources_path
    else
      @tile_source = r.tile_source
      render 'edit'
    end
  end

  def destroy
    ts = GttTileSource.find params[:id]
    ts.destroy
    redirect_to gtt_tile_sources_path
  end


  private

  def tile_source_params
    return {} unless params[:tile_source]

    params[:tile_source].permit(
      :name, :type, :attributions,       # common for all types
      :url, :min_zoom, :max_zoom         # GttOsmTileSource
    )
  end
end
