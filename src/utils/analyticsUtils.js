import { supabase } from '../supabase/supabaseClient';

// تتبع زيارة جديدة للصفحة الرئيسية
export const trackHomePageVisit = async () => {
  try {
    // إنشاء معرف فريد للزائر
    const visitorId = generateVisitorId();
    
    // إدخال الزيارة الجديدة
    const { error } = await supabase
      .from('page_visits')
      .insert({
        page_type: 'home',
        visitor_id: visitorId,
        visit_date: new Date().toISOString(),
      });

    if (error) {
      console.error('Error tracking homepage visit:', error);
    }
    
    // تحديث إجمالي عدد الزيارات
    updateTotalVisits();
    
    return visitorId;
  } catch (error) {
    console.error('Error in trackHomePageVisit:', error);
  }
};

// تتبع زيارة صفحة مشروع
export const trackProjectPageVisit = async (projectId, projectName) => {
  try {
    // إنشاء معرف فريد للزائر
    const visitorId = generateVisitorId();
    
    // تحويل معرف المشروع إلى نص لضمان التوافق مع قاعدة البيانات
    const projectIdString = String(projectId);
    
    // إدخال الزيارة الجديدة
    const { error } = await supabase
      .from('page_visits')
      .insert({
        page_type: 'project',
        project_id: projectIdString,
        project_name: projectName,
        visitor_id: visitorId,
        visit_date: new Date().toISOString(),
      });

    if (error) {
      console.error(`Error tracking project visit for project ${projectId}:`, error);
    }
    
    // تحديث إجمالي عدد الزيارات
    updateTotalVisits();
    
    return visitorId;
  } catch (error) {
    console.error('Error in trackProjectPageVisit:', error);
  }
};

// تحديث إجمالي عدد الزيارات
const updateTotalVisits = async () => {
  try {
    // التحقق من وجود إحصائيات مسبقة
    const { data, error } = await supabase
      .from('visit_stats')
      .select('*')
      .eq('id', 1)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching visit stats:', error);
      return;
    }
    
    if (!data) {
      // إذا لم تكن هناك إحصائيات مسبقة، قم بإنشاء سجل جديد
      await supabase
        .from('visit_stats')
        .insert({
          id: 1,
          total_visits: 1,
          last_updated: new Date().toISOString()
        });
    } else {
      // تحديث الإحصائيات الموجودة
      await supabase
        .from('visit_stats')
        .update({
          total_visits: data.total_visits + 1,
          last_updated: new Date().toISOString()
        })
        .eq('id', 1);
    }
  } catch (error) {
    console.error('Error in updateTotalVisits:', error);
  }
};

// إنشاء معرف فريد للزائر (يستخدم session storage للتتبع)
const generateVisitorId = () => {
  // التحقق من وجود معرف زائر مخزن مسبقًا
  const existingId = sessionStorage.getItem('visitor_id');
  if (existingId) {
    return existingId;
  }
  
  // إنشاء معرف جديد
  const newId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  sessionStorage.setItem('visitor_id', newId);
  return newId;
};

// جلب بيانات الزيارات للعرض في لوحة التحكم
export const fetchVisitStats = async () => {
  try {
    // الحصول على إجمالي الزيارات
    const { data: totalStats, error: totalStatsError } = await supabase
      .from('visit_stats')
      .select('*')
      .eq('id', 1)
      .single();
      
    if (totalStatsError) {
      console.error('Error fetching total visits:', totalStatsError);
      return null;
    }
    
    // الحصول على زيارات الصفحة الرئيسية (اليوم/الأسبوع/الشهر)
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);
    
    const todayStr = today.toISOString().split('T')[0];
    const weekAgoStr = weekAgo.toISOString();
    const monthAgoStr = monthAgo.toISOString();
    
    // زيارات اليوم
    const { data: todayVisits, error: todayError } = await supabase
      .from('page_visits')
      .select('*')
      .eq('page_type', 'home')
      .gte('visit_date', todayStr);
      
    if (todayError) {
      console.error('Error fetching today visits:', todayError);
    }
    
    // زيارات الأسبوع
    const { data: weekVisits, error: weekError } = await supabase
      .from('page_visits')
      .select('*')
      .eq('page_type', 'home')
      .gte('visit_date', weekAgoStr);
      
    if (weekError) {
      console.error('Error fetching week visits:', weekError);
    }
    
    // زيارات الشهر
    const { data: monthVisits, error: monthError } = await supabase
      .from('page_visits')
      .select('*')
      .eq('page_type', 'home')
      .gte('visit_date', monthAgoStr);
      
    if (monthError) {
      console.error('Error fetching month visits:', monthError);
    }
    
    // إحصائيات زيارات المشاريع - usando un enfoque alternativo sin .group()
    const { data: rawProjectVisits, error: projectError } = await supabase
      .from('page_visits')
      .select('project_id, project_name')
      .eq('page_type', 'project');
      
    if (projectError) {
      console.error('Error fetching project visits:', projectError);
    }
    
    // Procesamos manualmente los datos para agrupar y contar
    const projectVisits = [];
    const projectCounts = {};
    
    if (rawProjectVisits && rawProjectVisits.length > 0) {
      // Agrupamos y contamos por project_id y project_name
      rawProjectVisits.forEach(visit => {
        const key = `${visit.project_id}:${visit.project_name}`;
        if (!projectCounts[key]) {
          projectCounts[key] = {
            project_id: visit.project_id,
            project_name: visit.project_name,
            count: 0
          };
        }
        projectCounts[key].count++;
      });
      
      // Convertimos el objeto a array
      Object.values(projectCounts).forEach(item => {
        projectVisits.push(item);
      });
    }
    
    // تجميع كل البيانات
    return {
      totalVisits: totalStats?.total_visits || 0,
      todayHomeVisits: todayVisits?.length || 0,
      weekHomeVisits: weekVisits?.length || 0,
      monthHomeVisits: monthVisits?.length || 0,
      projectVisits: projectVisits || [],
      lastUpdated: totalStats?.last_updated
    };
  } catch (error) {
    console.error('Error in fetchVisitStats:', error);
    return null;
  }
};
