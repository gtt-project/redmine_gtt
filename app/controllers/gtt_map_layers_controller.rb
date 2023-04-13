class GttMapLayersController < ApplicationController
  layout 'admin'

  before_action :require_admin

  self.main_menu = false

  def index
    @map_layers = GttMapLayer.sorted
  end

  def new
    @map_layer = GttMapLayer.new
  end

  def create
    r = RedmineGtt::Actions::CreateMapLayer.(map_layer_params)
    if r.map_layer_created?
      redirect_to(params[:continue] ? new_gtt_map_layer_path : gtt_map_layers_path)
    else
      @map_layer = r.map_layer
      render 'new'
    end
  end

  def edit
    @map_layer = GttMapLayer.find(params[:id])
  end

  def update
    ml = GttMapLayer.find(params[:id])
    r = RedmineGtt::Actions::UpdateMapLayer.(ml, map_layer_params)
    if r.map_layer_updated?
      respond_to do |format|
        format.html {
          flash[:notice] = l(:notice_successful_update)
          redirect_to gtt_map_layers_path
        }
        format.js { head 200 }
      end
    else
      respond_to do |format|
        format.html {
          @map_layer = r.map_layer
          render 'edit'
        }
        format.js { head 422 }
      end
    end
  end

  def destroy
    ml = GttMapLayer.find(params[:id])
    ml.destroy
    redirect_to gtt_map_layers_path
  end


  private

  def map_layer_params
    return {} unless params[:map_layer]

    params[:map_layer].permit(
      :name, :default, :global, :baselayer, :position,
      :layer, :layer_options_string,
      :source, :source_options_string,
      :format, :format_options_string,
      :styles
    )
    end
  end
