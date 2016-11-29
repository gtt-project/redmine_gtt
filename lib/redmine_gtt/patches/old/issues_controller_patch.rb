module RedmineGtt
  module Patches

    module IssuesControllerPatch
      def index
        retrieve_query
        sort_init(@query.sort_criteria.empty? ? [['id', 'desc']] : @query.sort_criteria)
        sort_update(@query.sortable_columns)
        @query.sort_criteria = sort_criteria.to_a

        if @query.valid?
          case params[:format]
          when 'csv', 'pdf'
            @limit = Setting.issues_export_limit.to_i
          when 'atom'
            @limit = Setting.feeds_limit.to_i
          when 'xml', 'json'
            @offset, @limit = api_offset_and_limit
          else
            @limit = per_page_option
          end

          @issue_count = @query.issue_count
          @issue_pages = Redmine::Pagination::Paginator.new @issue_count, @limit, params['page']
          @offset ||= @issue_pages.offset

          # added for sort by distance
          # query exsamples
          #   when on click ジオメトリ on sort bar of issues table
          #     Started GET "/projects/test/issues?c%5B%5D=tracker&c%5B%5D=status&c%5B%5D=priority&c%5B%5D=subject&c%5B%5D=assigned_to&c%5B%5D=updated_on&c%5B%5D=geom&f%5B%5D=status_id&f%5B%5D=geom&f%5B%5D=&group_by=&op%5Bgeom%5D=n&op%5Bstatus_id%5D=o&set_filter=1&sort=geom%2Cid%3Adesc&utf8=%E2%9C%93&v%5Bgeom%5D%5B%5D=35.696%2C139.2" for 127.0.0.1 at 2014-09-02 03:13:44 +0900
          #     Processing by IssuesController#index as HTML
          #       Parameters: {"c"=>["tracker", "status", "priority", "subject", "assigned_to", "updated_on", "geom"], "f"=>["status_id", "geom", ""], "group_by"=>"", "op"=>{"geom"=>"n", "status_id"=>"o"}, "set_filter"=>"1", "sort"=>"geom,id:desc", "utf8"=>"✓", "v"=>{"geom"=>["35.696,139.2"]}, "project_id"=>"test"}
          #

          if (params[:sort] && params[:sort].include?("geom"))
            if params[:v]
              s = params[:v][:geom][0]
            else
              s = params[:sort].split(':')[1]
            end
            lat = s.split(',')[0]
            lng = s.split(',')[1]
            sc = "ST_Distance(issues.geom, St_GeomFromText('POINT(#{lng} #{lat})',4326)) ASC "
          end

          @issues = @query.issues(:include => [:assigned_to, :tracker, :priority, :category, :fixed_version],
                                  :order => sc.present? ? sc : sort_clause,
                                  :offset => @offset,
                                  :limit => @limit)
          @issue_count_by_group = @query.issue_count_by_group

          respond_to do |format|
            format.html { render :template => 'issues/index', :layout => !request.xhr? }
            format.api  {
              Issue.load_visible_relations(@issues) if include_in_api_response?('relations')
            }
            format.atom { render_feed(@issues, :title => "#{@project || Setting.app_title}: #{l(:label_issue_plural)}") }
            format.csv  { send_data(query_to_csv(@issues, @query, params), :type => 'text/csv; header=present', :filename => 'issues.csv') }
            format.pdf  { send_data(issues_to_pdf(@issues, @project, @query), :type => 'application/pdf', :filename => 'issues.pdf') }
          end
        else
          respond_to do |format|
            format.html { render(:template => 'issues/index', :layout => !request.xhr?) }
            format.any(:atom, :csv, :pdf) { render(:nothing => true) }
            format.api { render_validation_errors(@query) }
          end
        end
      rescue ActiveRecord::RecordNotFound
        render_404
      end
    end
  end
end
